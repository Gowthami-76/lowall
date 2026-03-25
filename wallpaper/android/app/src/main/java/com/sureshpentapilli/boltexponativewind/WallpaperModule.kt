package com.sureshpentapilli.boltexponativewind

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.StrictMode
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.URL
import android.util.Log
import android.content.ContentValues
import android.provider.MediaStore
import android.os.Environment
import com.facebook.react.bridge.Promise
import android.os.Build
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class WallpaperModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WallpaperModule"
    }

    @ReactMethod
    fun setWallpaperFromUrl(imageUrl: String) {
        try {
            // Temporary policy to allow network on main thread (for demo purpose)
            val policy = StrictMode.ThreadPolicy.Builder().permitAll().build()
            StrictMode.setThreadPolicy(policy)

            val url = URL(imageUrl)
            val connection = url.openConnection()
            connection.connect()
            val inputStream = connection.getInputStream()
            val bitmap = BitmapFactory.decodeStream(inputStream)

            val wallpaperManager = WallpaperManager.getInstance(reactApplicationContext)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // Force set only HOME wallpaper
                wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM)
                Log.d("WallpaperModule", "Home screen wallpaper set successfully")
            } else {
                // Fallback for older versions (may apply to both)
                wallpaperManager.setBitmap(bitmap)
                Log.d("WallpaperModule", "Wallpaper set (older API, may affect lock screen too)")
            }

        } catch (e: Exception) {
            Log.e("WallpaperModule", "Error setting wallpaper", e)
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun setWallpaperFromUrlBackOld(imageUrl: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d("WallpaperModule", "🖼️ Starting download: $imageUrl")

                // Download image
                val url = URL(imageUrl)
                val connection = url.openConnection()
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                val inputStream = connection.getInputStream()
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream.close()

                if (bitmap == null) {
                    Log.e("WallpaperModule", "❌ Bitmap is null")
                    withContext(Dispatchers.Main) {
                        promise.reject("BITMAP_NULL", "Failed to decode image")
                    }
                    return@launch
                }

                Log.d("WallpaperModule", "✅ Bitmap: ${bitmap.width}x${bitmap.height}")

                // Set wallpaper on main thread
               // Get screen size
            val wm = WallpaperManager.getInstance(reactApplicationContext)
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val screenWidth = displayMetrics.widthPixels
            val screenHeight = displayMetrics.heightPixels

            Log.d("WallpaperModule", "📱 Screen size: ${screenWidth}x${screenHeight}")

            // Scale bitmap to fit screen exactly
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, screenWidth, screenHeight, true)
            //Log.d("WallpaperModule", "📏 Scaled Bitmap: ${scaledBitmap.width}x${scaledBitmap.height}")

            withContext(Dispatchers.Main) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        wm.setBitmap(
                            scaledBitmap,
                            null,
                            true,
                            WallpaperManager.FLAG_SYSTEM
                        )
                        Log.d("WallpaperModule", "✅ Wallpaper set (API 24+)")
                    } else {
                        wm.setBitmap(scaledBitmap)
                        Log.d("WallpaperModule", "✅ Wallpaper set (legacy)")
                    }

                    promise.resolve("Wallpaper set successfully (fit to screen)")
                } catch (e: Exception) {
                    Log.e("WallpaperModule", "❌ Set wallpaper error", e)
                    promise.reject("SET_ERROR", e.message, e)
                }
                }
            } catch (e: Exception) {
                Log.e("WallpaperModule", "❌ Download error", e)
                withContext(Dispatchers.Main) {
                    promise.reject("DOWNLOAD_ERROR", e.message, e)
                }
            }
        }
    }
    fun fitInside(bitmap: Bitmap, targetWidth: Int, targetHeight: Int): Bitmap {
    val srcWidth = bitmap.width
    val srcHeight = bitmap.height

    val scale = minOf(
        targetWidth.toFloat() / srcWidth.toFloat(),
        targetHeight.toFloat() / srcHeight.toFloat()
    )

    val scaledWidth = (srcWidth * scale).toInt()
    val scaledHeight = (srcHeight * scale).toInt()

    return Bitmap.createScaledBitmap(bitmap, scaledWidth, scaledHeight, true)
}
 @ReactMethod
    fun setWallpaperFromUrlBack(imageUrl: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d("WallpaperModule", "🖼️ Starting download: $imageUrl")

                // Download image
                val url = URL(imageUrl)
                val connection = url.openConnection()
                connection.connectTimeout = 10000
                connection.readTimeout = 10000
                val inputStream = connection.getInputStream()
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream.close()

                if (bitmap == null) {
                    Log.e("WallpaperModule", "❌ Bitmap is null")
                    withContext(Dispatchers.Main) {
                        promise.reject("BITMAP_NULL", "Failed to decode image")
                    }
                    return@launch
                }

                Log.d("WallpaperModule", "✅ Bitmap: ${bitmap.width}x${bitmap.height}")

                // Set wallpaper on main thread
               // Get screen size
            val wm = WallpaperManager.getInstance(reactApplicationContext)
            val displayMetrics = reactApplicationContext.resources.displayMetrics
            val screenWidth = displayMetrics.widthPixels
            val screenHeight = displayMetrics.heightPixels

            Log.d("WallpaperModule", "📱 Screen size: ${screenWidth}x${screenHeight}")
val finalBitmap = fitInside(bitmap, screenWidth, screenHeight)

            // Scale bitmap to fit screen exactly
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, screenWidth, screenHeight, true)
            //Log.d("WallpaperModule", "📏 Scaled Bitmap: ${scaledBitmap.width}x${scaledBitmap.height}")

            withContext(Dispatchers.Main) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        wm.setBitmap(
                            scaledBitmap,
                            null,
                            true,
                            WallpaperManager.FLAG_SYSTEM
                        )
                        Log.d("WallpaperModule", "✅ Wallpaper set (API 24+)")
                    } else {
                        wm.setBitmap(finalBitmap)
                        Log.d("WallpaperModule", "✅ Wallpaper set (legacy)")
                    }

                    promise.resolve("Wallpaper set successfully (fit to screen)")
                } catch (e: Exception) {
                    Log.e("WallpaperModule", "❌ Set wallpaper error", e)
                    promise.reject("SET_ERROR", e.message, e)
                }
                }
            } catch (e: Exception) {
                Log.e("WallpaperModule", "❌ Download error", e)
                withContext(Dispatchers.Main) {
                    promise.reject("DOWNLOAD_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun setLockScreenFromUrl(imageUrl: String) {
        try {
            Log.d("WallpaperModule", "Setting lock screen wallpaper")

            // Temporary policy to allow network on main thread (not recommended in production)
            val policy = StrictMode.ThreadPolicy.Builder().permitAll().build()
            StrictMode.setThreadPolicy(policy)

            val url = URL(imageUrl)
            val connection = url.openConnection()
            connection.connect()
            val inputStream = connection.getInputStream()
            val bitmap = BitmapFactory.decodeStream(inputStream)

            val wallpaperManager = WallpaperManager.getInstance(reactApplicationContext)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // Only available from Android N (API 24) onwards
                wallpaperManager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK)
                Log.d("WallpaperModule", "Lock screen wallpaper set successfully")
            } else {
                Log.e("WallpaperModule", "Lock screen wallpaper not supported on this Android version")
            }

        } catch (e: Exception) {
            Log.e("WallpaperModule", "Error setting lock screen wallpaper", e)
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun downloadImageFromUrl(imageUrl: String, fileName: String, promise: Promise) {
        try {
            val policy = StrictMode.ThreadPolicy.Builder().permitAll().build()
            StrictMode.setThreadPolicy(policy)

            val url = URL(imageUrl)
            val connection = url.openConnection()
            connection.connect()
            val inputStream = connection.getInputStream()
            val bitmap = BitmapFactory.decodeStream(inputStream)

            val values = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
                put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/MyAppWallpapers")
            }

            val uri = reactApplicationContext.contentResolver.insert(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values
            )

            if (uri != null) {
                val outputStream = reactApplicationContext.contentResolver.openOutputStream(uri)
                if (outputStream != null) {
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
                    outputStream.close()
                    promise.resolve(uri.toString())
                    Log.d("WallpaperModule", "Image saved to gallery: $uri")
                } else {
                    promise.reject("OUTPUT_ERROR", "Failed to open output stream")
                    Log.e("WallpaperModule", "Failed to open output stream")
                }
            } else {
                promise.reject("INSERT_ERROR", "Failed to create media store entry")
                Log.e("WallpaperModule", "Failed to create media store entry")
            }

        } catch (e: Exception) {
            Log.e("WallpaperModule", "Error downloading image", e)
            promise.reject("DOWNLOAD_ERROR", e)
        }
    }
}