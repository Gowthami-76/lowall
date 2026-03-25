package com.sureshpentapilli.boltexponativewind

import android.app.AlarmManager
import android.app.PendingIntent
import android.app.WallpaperManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Bitmap

import android.os.Build
import android.util.Log
import androidx.work.*
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit
import java.util.Calendar

class WallpaperScheduler(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WallpaperScheduler"
    }

    @ReactMethod
    fun saveApiCredentials(token: String, baseUrl: String, promise: Promise) {
        try {
            ApiStorageHelper.saveCredentials(reactApplicationContext, token, baseUrl)
            Log.d("WallpaperScheduler", "✅ API credentials saved")
            promise.resolve("Credentials saved")
        } catch (e: Exception) {
            Log.e("WallpaperScheduler", "❌ Failed to save credentials", e)
            promise.reject("SAVE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun scheduleWallpaperUpdate(endTimeMillis: Double, promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // Calculate next 10-minute boundary
            val triggerTime = calculateNext30MinBoundary()

            Log.d("WallpaperScheduler", "📅 Scheduling alarm for next 10-min boundary: ${java.util.Date(triggerTime)}")

            cancelScheduledUpdate()

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, WallpaperUpdateReceiver::class.java)
            
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                WALLPAPER_REQUEST_CODE,
                intent,
                flags
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTime,
                        pendingIntent
                    )
                    Log.d("WallpaperScheduler", "✅ Exact alarm scheduled")
                } else {
                    scheduleWithWorkManager(context, triggerTime)
                    Log.d("WallpaperScheduler", "⚠️ Using WorkManager fallback - exact alarms not permitted")
                }
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
                Log.d("WallpaperScheduler", "✅ Exact alarm scheduled (legacy)")
            }

            promise.resolve("Alarm scheduled successfully")
        } catch (e: Exception) {
            Log.e("WallpaperScheduler", "❌ Failed to schedule alarm", e)
            promise.reject("SCHEDULE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelScheduledUpdate() {
        try {
            val context = reactApplicationContext
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, WallpaperUpdateReceiver::class.java)
            
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_NO_CREATE
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                WALLPAPER_REQUEST_CODE,
                intent,
                flags
            )

            pendingIntent?.let {
                alarmManager.cancel(it)
                it.cancel()
                Log.d("WallpaperScheduler", "🚫 Alarm cancelled")
            }

            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        } catch (e: Exception) {
            Log.e("WallpaperScheduler", "❌ Error cancelling alarm", e)
        }
    }

    private fun scheduleWithWorkManager(context: Context, triggerTime: Long) {
        val currentTime = System.currentTimeMillis()
        val delay = maxOf(0L, triggerTime - currentTime)

        val workRequest = OneTimeWorkRequestBuilder<WallpaperUpdateWorker>()
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork(
                WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                workRequest
            )
    }

    companion object {
        const val WALLPAPER_REQUEST_CODE = 1001
        const val WORK_NAME = "wallpaper_update_work"
        
        // Helper function to calculate next 10-minute boundary
        fun calculateNext10MinBoundary(): Long {
            val calendar = Calendar.getInstance()
            val currentMinute = calendar.get(Calendar.MINUTE)
            
            // Calculate minutes until next 10-min boundary (0, 10, 20, 30, 40, 50)
            val minutesToAdd = 10 - (currentMinute % 10)
            
            // Set to next 10-min boundary
            calendar.add(Calendar.MINUTE, minutesToAdd)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            
            val nextBoundary = calendar.timeInMillis
            
            return nextBoundary
        }

        fun calculateNext30MinBoundary(): Long {
            val calendar = Calendar.getInstance()
            val currentMinute = calendar.get(Calendar.MINUTE)

            // Calculate minutes until next 10-min boundary (0, 10, 20, 30, 40, 50)
            val minutesToAdd = 30 - (currentMinute % 30)

            // Set to next 10-min boundary
            calendar.add(Calendar.MINUTE, minutesToAdd)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)

            val nextBoundary = calendar.timeInMillis

            return nextBoundary
        }
    }
}

class WallpaperUpdateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("WallpaperUpdateReceiver", "⏰ Alarm triggered! Starting wallpaper update...")
        
        val workRequest = OneTimeWorkRequestBuilder<WallpaperUpdateWorker>()
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(context).enqueue(workRequest)
    }
}

class WallpaperUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            Log.d("WallpaperUpdateWorker", "🔄 Starting wallpaper update")

            // Get stored credentials
            val token = ApiStorageHelper.getToken(applicationContext)
            val baseUrl = ApiStorageHelper.getBaseUrl(applicationContext)

            if (token == null || baseUrl == null) {
                Log.e("WallpaperUpdateWorker", "❌ Missing credentials (token or baseUrl)")
                return Result.failure()
            }

            Log.d("WallpaperUpdateWorker", "✅ Credentials found, fetching wallpaper...")

            // Fetch current wallpaper from API
            val wallpaperUrl = fetchCurrentWallpaper(token, baseUrl)

            if (wallpaperUrl != null) {
                // Set wallpaper
                setWallpaperBackground(wallpaperUrl)
                Log.d("WallpaperUpdateWorker", "✅ Wallpaper updated successfully")

                // ✅ Schedule next alarm for next 10-min boundary
                scheduleNextAlarm()

                Result.success()
            } else {
                Log.e("WallpaperUpdateWorker", "❌ Failed to fetch wallpaper URL")
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e("WallpaperUpdateWorker", "❌ Worker failed", e)
            Result.failure()
        }
    }

    private suspend fun fetchCurrentWallpaper(token: String, baseUrl: String): String? {
        return withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                // Get current date and time
                val now = Calendar.getInstance()
                val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                val timeFormat = java.text.SimpleDateFormat("HH:mm", java.util.Locale.US)

                val currentDate = dateFormat.format(now.time)
                val currentTime = timeFormat.format(now.time)

                // Build URL with date and time parameters
                val apiUrl = "$baseUrl/v1/slot/current?date=$currentDate&time=$currentTime"
                Log.d("WallpaperUpdateWorker", "📡 Fetching from: $apiUrl")
                Log.d("WallpaperUpdateWorker", "📅 Date: $currentDate, Time: $currentTime")

                // Make API request
                val url = URL(apiUrl)
                connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("Authorization", "Bearer $token")
                connection.doInput = true
                connection.connectTimeout = 10000
                connection.readTimeout = 10000

                val responseCode = connection.responseCode
                Log.d("WallpaperUpdateWorker", "Response code: $responseCode")

                if (responseCode == 200) {
                    val inputStream = connection.inputStream
                    val response = inputStream.bufferedReader().use { it.readText() }
                    inputStream.close()

                    Log.d("WallpaperUpdateWorker", "API Response: $response")

                    // Parse JSON response
                    val mediaUrl = parseMediaUrl(response)

                    if (mediaUrl != null) {
                        Log.d("WallpaperUpdateWorker", "✅ Media URL found: $mediaUrl")

                        // Get signed URL
                        val signedUrl = getSignedUrl(mediaUrl, token, baseUrl)

                        if (signedUrl != null) {
                            return@withContext signedUrl
                        }
                    } else {
                        Log.e("WallpaperUpdateWorker", "❌ No media URL in response")
                    }
                } else {
                    val errorStream = connection.errorStream
                    val errorResponse = errorStream?.bufferedReader()?.use { it.readText() }
                    Log.e("WallpaperUpdateWorker", "API error: $responseCode - $errorResponse")
                }

                null
            } catch (e: Exception) {
                Log.e("WallpaperUpdateWorker", "❌ API fetch error", e)
                null
            } finally {
                connection?.disconnect()
            }
        }
    }

    private fun scheduleNextAlarm() {
        try {
            // Calculate next 10-minute boundary
            val triggerTime = WallpaperScheduler.calculateNext30MinBoundary()

            Log.d("WallpaperUpdateWorker", "📅 Scheduling next alarm for: ${java.util.Date(triggerTime)}")

            val alarmManager = applicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(applicationContext, WallpaperUpdateReceiver::class.java)

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getBroadcast(
                applicationContext,
                WallpaperScheduler.WALLPAPER_REQUEST_CODE,
                intent,
                flags
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTime,
                        pendingIntent
                    )
                    Log.d("WallpaperUpdateWorker", "✅ Next alarm scheduled automatically for next 10-min boundary")
                } else {
                    Log.w("WallpaperUpdateWorker", "⚠️ Cannot schedule exact alarms")
                }
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
                Log.d("WallpaperUpdateWorker", "✅ Next alarm scheduled (legacy)")
            }
        } catch (e: Exception) {
            Log.e("WallpaperUpdateWorker", "❌ Failed to schedule next alarm", e)
        }
    }

    private fun parseMediaUrl(jsonResponse: String): String? {
        try {
            val mediaUrlPattern = """"mediaUrl"\s*:\s*"([^"]+)"""".toRegex()
            val match = mediaUrlPattern.find(jsonResponse)
            val result = match?.groupValues?.get(1)

            if (result != null) {
                Log.d("WallpaperUpdateWorker", "Parsed mediaUrl: $result")
            } else {
                Log.e("WallpaperUpdateWorker", "Failed to parse mediaUrl from response")
            }

            return result
        } catch (e: Exception) {
            Log.e("WallpaperUpdateWorker", "JSON parse error", e)
            return null
        }
    }

    private suspend fun getSignedUrl(mediaUrl: String, token: String, baseUrl: String): String? {
        return withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                val apiUrl = "$baseUrl/v1/file/get-signed-urls"
                Log.d("WallpaperUpdateWorker", "📡 Getting signed URL from: $apiUrl")

                val url = URL(apiUrl)
                connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Authorization", "Bearer $token")
                connection.setRequestProperty("Content-Type", "application/json")
                connection.doOutput = true
                connection.doInput = true
                connection.connectTimeout = 10000
                connection.readTimeout = 10000

                // Send request body
                val requestBody = """{"urls":["$mediaUrl"]}"""
                Log.d("WallpaperUpdateWorker", "Request body: $requestBody")

                val outputStream = connection.outputStream
                outputStream.write(requestBody.toByteArray(Charsets.UTF_8))
                outputStream.flush()
                outputStream.close()

                val responseCode = connection.responseCode
                Log.d("WallpaperUpdateWorker", "Signed URL response code: $responseCode")

                if (responseCode == 200 || responseCode == 201) {
                    val inputStream = connection.inputStream
                    val response = inputStream.bufferedReader().use { it.readText() }
                    inputStream.close()

                    Log.d("WallpaperUpdateWorker", "Signed URL response: $response")

                    if (response.isEmpty()) {
                        Log.e("WallpaperUpdateWorker", "❌ Empty response body")
                        return@withContext null
                    }

                    val signedUrl = parseSignedUrl(response, mediaUrl)

                    if (signedUrl != null) {
                        Log.d("WallpaperUpdateWorker", "✅ Signed URL obtained")
                    } else {
                        Log.e("WallpaperUpdateWorker", "❌ Failed to parse signed URL")
                    }

                    return@withContext signedUrl
                } else {
                    val errorStream = connection.errorStream
                    val errorResponse = errorStream?.bufferedReader()?.use { it.readText() }
                    Log.e("WallpaperUpdateWorker", "Signed URL error: $responseCode - $errorResponse")
                }

                null
            } catch (e: Exception) {
                Log.e("WallpaperUpdateWorker", "❌ Signed URL error", e)
                null
            } finally {
                connection?.disconnect()
            }
        }
    }

    private fun parseSignedUrl(jsonResponse: String, originalUrl: String): String? {
        try {
            Log.d("WallpaperUpdateWorker", "Parsing signed URL from response...")

            // Try multiple patterns
            val escapedUrl = originalUrl.replace("/", "\\/")
            var pattern = """"${escapedUrl}"\s*:\s*"([^"]+)"""".toRegex()
            var match = pattern.find(jsonResponse)

            if (match != null) {
                return match.groupValues[1].replace("\\/", "/")
            }

            pattern = """"${originalUrl}"\s*:\s*"([^"]+)"""".toRegex()
            match = pattern.find(jsonResponse)

            if (match != null) {
                return match.groupValues[1]
            }

            pattern = """"(https?://[^"]+)"""".toRegex()
            match = pattern.find(jsonResponse)

            if (match != null) {
                return match.groupValues[1]
            }

            Log.e("WallpaperUpdateWorker", "❌ No pattern matched")
            return null
        } catch (e: Exception) {
            Log.e("WallpaperUpdateWorker", "Parse signed URL error", e)
            return null
        }
    }

   


    private suspend fun setWallpaperBackground(imageUrl: String) {
        withContext(Dispatchers.IO) {
            try {
                Log.d("WallpaperUpdateWorker", "⬇️ Downloading image from: $imageUrl")

                val url = URL(imageUrl)
               val connection = url.openConnection()
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                val inputStream = connection.getInputStream()
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream.close()

                if (bitmap == null) {
                    Log.e("WallpaperUpdateWorker", "❌ Failed to decode bitmap")
                    return@withContext
                }

                Log.d("WallpaperUpdateWorker", "✅ Bitmap decoded: ${bitmap.width}x${bitmap.height}")

               withContext(Dispatchers.Main) {
                    val wallpaperManager = WallpaperManager.getInstance(applicationContext)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                       wallpaperManager.setBitmap(
                            bitmap,
                            null,
                            true,
                            WallpaperManager.FLAG_SYSTEM
                        )
                        Log.d("WallpaperUpdateWorker", "✅ Wallpaper set successfully (API 24+)")
                  } else {
                       wallpaperManager.setBitmap(bitmap)
                        Log.d("WallpaperUpdateWorker", "✅ Wallpaper set successfully (legacy)")
                    }
               }
            } catch (e: Exception) {
                Log.e("WallpaperUpdateWorker", "❌ Failed to set wallpaper", e)
                throw e
            }
        }
    }
}

object ApiStorageHelper {
    private const val PREFS_NAME = "WallpaperPrefs"
    private const val KEY_TOKEN = "auth_token"
    private const val KEY_BASE_URL = "base_url"

    fun saveCredentials(context: Context, token: String, baseUrl: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_BASE_URL, baseUrl)
            apply()
        }
        Log.d("ApiStorageHelper", "✅ Credentials saved to SharedPreferences")
    }

    fun getToken(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val token = prefs.getString(KEY_TOKEN, null)
        Log.d("ApiStorageHelper", if (token != null) "✅ Token retrieved" else "❌ No token found")
        return token
    }

    fun getBaseUrl(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val baseUrl = prefs.getString(KEY_BASE_URL, null)
        Log.d("ApiStorageHelper", if (baseUrl != null) "✅ BaseUrl retrieved: $baseUrl" else "❌ No baseUrl found")
        return baseUrl
    }
}