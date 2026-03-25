import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Terms of Service</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <FileText size={40} color="#8B5CF6" />
          </View>
          <Text style={styles.iconText}>Terms of Service</Text>
          <Text style={styles.iconSubtext}>Last updated: January 2025</Text>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, installing, or using the Wallpaper app, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            Our app provides access to a collection of wallpapers and digital artwork for personal use.
            We offer both free and premium content to enhance your device's appearance.
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account. You must notify us immediately of any unauthorized use.
          </Text>

          <Text style={styles.sectionTitle}>4. Content and Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All wallpapers and content provided through our app are protected by copyright and other intellectual
            property laws. You may download and use wallpapers for personal, non-commercial purposes only.
          </Text>

          <Text style={styles.sectionTitle}>5. Premium Subscriptions</Text>
          <Text style={styles.paragraph}>
            Premium subscriptions provide access to exclusive content and features. Subscriptions automatically
            renew unless cancelled. You may cancel at any time through your account settings.
          </Text>

          <Text style={styles.sectionTitle}>6. User Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to use our service for any unlawful purpose or in any way that could damage,
            disable, or impair our service. This includes uploading inappropriate content or violating others' rights.
          </Text>

          <Text style={styles.sectionTitle}>7. Privacy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. Please review our Privacy Policy to understand how we collect,
            use, and protect your information.
          </Text>

          <Text style={styles.sectionTitle}>8. Disclaimers</Text>
          <Text style={styles.paragraph}>
            Our service is provided "as is" without warranties of any kind. We do not guarantee that our
            service will be uninterrupted, error-free, or completely secure.
          </Text>

          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            In no event shall we be liable for any indirect, incidental, special, or consequential damages
            arising out of or in connection with your use of our service.
          </Text>

          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify users of significant
            changes through the app or via email. Continued use of the service constitutes acceptance of updated terms.
          </Text>

          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at legal@wallpaperapp.com
            or through our Help Center.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  iconSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  iconSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  contentCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 20,
  },
  paragraph: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  bottomPadding: {
    height: 40,
  },
});