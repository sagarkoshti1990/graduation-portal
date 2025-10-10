import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import WebComponentPlayer from '../components/webComponents/WebComponentPlayer';
import ProjectWebComponentPlayer from '../components/webComponents/ProjectWebComponentPlayer';
import { useLanguage } from '../contexts/LanguageContext';

interface WebComponentScreenProps {
  navigation: any;
}

const WebComponentScreen: React.FC<WebComponentScreenProps> = ({
  navigation,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const { t } = useLanguage();

  // Sample Web Component configurations
  const webComponentOptions = [
    {
      id: 'web-component',
      title: 'Web Component',
      description: 'Web Component',
      icon: '🌐',
    },
    {
      id: 'project-web-component',
      title: 'Project Web Component',
      description: 'Project Web Component',
      icon: '🏢',
    },
  ];

  // Generate player configuration based on Web Component type
  const getPlayerConfig = () => {
    return {
      context: {
        mode: 'play',
        partner: [],
        pdata: {
          id: 'pratham.admin.portal',
          ver: '1.0.0',
          pid: 'admin-portal',
        },
        contentId: 'do_21434362071134208011421',
        timeDiff: -0.089,
        channel: 'pos-channel',
        tags: ['pos-channel'],
        contextRollup: {
          l1: 'pos-channel',
        },
        objectRollup: {},
        userData: {
          firstName: 'akshata_youth',
          lastName: '',
        },
        host: '',
        endpoint: '/v1/telemetry',
        userName: 'akshata_youth',
        accToken: '',
        sid: '',
        uid: '',
        tenantId: '',
        tenantCode: 'pos-channel',
        did: '',
      },
      config: {
        showEndPage: false,
        endPage: [
          {
            template: 'assessment',
            contentType: ['SelfAssess'],
          },
        ],
        showStartPage: true,
        host: '',
        overlay: {
          showUser: false,
        },
        splash: {
          text: '',
          icon: '',
          bgImage: 'assets/icons/splacebackground_1.png',
          webLink: '',
        },
        apislug: '',
        repos: ['/sunbird-plugins/renderer'],
        plugins: [
          {
            id: 'org.sunbird.iframeEvent',
            ver: 1,
            type: 'plugin',
          },
          {
            id: 'org.sunbird.player.endpage',
            ver: 1.1,
            type: 'plugin',
          },
        ],
        sideMenu: {
          showShare: false,
          showDownload: true,
          showExit: true,
          showPrint: false,
          showReplay: true,
        },
      },
      data: {},
      metadata: {
        copyright: 'pos-channel',
        channel: 'pos-channel',
        language: ['English'],
        mimeType: 'video/mp4',
        objectType: 'Content',
        appIcon:
          'https://knowlg-public.s3-ap-south-1.amazonaws.com/content/do_21434362071134208011421/artifact/do_21434362119298252811422_1750930321647_energy_our_invisible_companion_202503180047004900.thumb.png',
        primaryCategory: 'Learning Resource',
        artifactUrl:
          'https://knowlg-public.s3-ap-south-1.amazonaws.com/content/assets/do_21434362071134208011421/energy_invisible_companion_video_202503180047004900.mp4',
        contentType: 'Resource',
        identifier: 'do_21434362071134208011421',
        audience: ['Student'],
        visibility: 'Default',
        mediaType: 'content',
        osId: 'org.ekstep.quiz.app',
        languageCode: ['en'],
        license: 'CC BY 4.0',
        domain: ['Learning for School'],
        name: 'Energy Our Invisible Companion',
        status: 'Live',
        code: '36267c42-8120-4886-9381-3dd4808a882a',
        interceptionPoints: {},
        description:
          'This resource is designed to explain the concept of energy. It explores what energy is, why it is called an invisible companion, and why it is essential in our lives. To make learning more engaging and effective, the resource includes interactive questions that help in better understanding these aspects.',
        createdOn: '2025-06-26T09:31:02.625+0000',
        lastUpdatedOn: '2025-06-26T09:45:39.212+0000',
        creator: 'sanket patil',
        pkgVersion: 1,
        versionKey: '1750930407208',
        framework: 'pos-framework',
        createdBy: '82470f1e-0154-48d2-aa2c-407b42b3c83f',
        resourceType: 'Learn',
      },
    };
  };

  const handleStartWebComponent = (webComponentId: string) => {
    setSelected(webComponentId);
  };

  const handleGoBack = () => {
    if (selected) {
      if (Platform.OS === 'web') {
        // Use window.confirm on web
        const shouldExit = window.confirm(
          'Are you sure you want to exit the current web component?',
        );
        if (shouldExit) {
          setSelected(null);
        }
      } else {
        // Use Alert on native platforms
        Alert.alert(
          'Exit Web Component',
          'Are you sure you want to exit the current web component?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => setSelected(null),
              style: 'destructive',
            },
          ],
        );
      }
    } else {
      navigation.goBack();
    }
  };

  // If a example is selected, show the player
  if (selected === 'project-web-component') {
    return (
      <View style={styles.playerContainer}>
        <Text>Project Web Component</Text>
        <ProjectWebComponentPlayer playerConfig={projectPlayerConfig} />
      </View>
    );
  } else if (selected) {
    const playerConfig = getPlayerConfig();
    return (
      <View style={styles.playerContainer}>
        <TouchableOpacity
          style={styles.floatingBackButton}
          onPress={handleGoBack}
          accessibilityLabel="Exit example"
          accessibilityRole="button"
        >
          <Text style={styles.floatingBackButtonText}>✕ Exit Example</Text>
        </TouchableOpacity>
        <WebComponentPlayer playerConfig={playerConfig} />
      </View>
    );
  }

  // Show example selection screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Web Component Player Demo</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>
            🎓 Interactive Web Component Player
          </Text>
        </View>

        {/* Example Options */}
        <View style={styles.examplesSection}>
          <Text style={styles.sectionTitle}>📝 Choose an Example</Text>
          <Text style={styles.sectionSubtitle}>
            Select any example below to start the interactive experience using
            the Web Component Player.
          </Text>

          {webComponentOptions.map(webComponent => (
            <TouchableOpacity
              key={webComponent.id}
              style={styles.exampleCard}
              onPress={() => handleStartWebComponent(webComponent.id)}
              accessibilityLabel={`Start ${webComponent.title}`}
              accessibilityRole="button"
            >
              <View style={styles.exampleCardHeader}>
                <Text style={styles.exampleIcon}>{webComponent.icon}</Text>
                <View style={styles.exampleCardContent}>
                  <Text style={styles.exampleTitle}>{webComponent.title}</Text>
                  <Text style={styles.exampleDescription}>
                    {webComponent.description}
                  </Text>
                </View>
              </View>
              <View style={styles.exampleCardFooter}>
                <Text style={styles.startButton}>Start Example →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(220, 53, 69, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  introSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 18,
    color: '#28A745',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  examplesSection: {
    marginBottom: 20,
  },
  exampleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exampleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exampleIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  exampleCardContent: {
    flex: 1,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  exampleDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  exampleCardFooter: {
    alignItems: 'flex-end',
  },
  startButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  techSection: {
    marginBottom: 20,
  },
  techCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6C757D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  techTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  techText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 4,
  },
  docSection: {
    backgroundColor: '#E7F3FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#B8DAFF',
  },
  docTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004085',
    marginBottom: 8,
  },
  docText: {
    fontSize: 14,
    color: '#004085',
    lineHeight: 20,
  },
});

export default WebComponentScreen;

const projectPlayerConfig = {
  config: {
    maxFileSize: 50,
    baseUrl: '',
    accessToken: 'edniddwdwdwdwduwdvwdwddwd',
    profileInfo: {},
    redirectionLinks: {
      contentPolicyLink: '',
      profilePage: '',
      unauthorizedRedirectUrl: '',
    },
    language: 'en',
    isPreview: true,
  },
  projectData: {
    _id: '685e84523e09080008326f31',
    userRole: 'PRINCIPAL,SPD,DEO,BEO,HM,HT',
    status: 'started',
    isDeleted: false,
    categories: [
      {
        _id: '5fcfa9a2457d6055e33843ef',
        externalId: 'teachers',
        name: 'Teachers',
      },
      {
        _id: '5fcfa9a2457d6055e33843f3',
        externalId: 'educationLeader',
        name: 'Education Leader',
      },
    ],
    tasks: [
      {
        _id: '4cdf260e-27c3-4165-9da1-7efde031f7f7',
        createdBy: '140558b9-7df4-4993-be3c-31eb8b9ca368',
        updatedBy: '140558b9-7df4-4993-be3c-31eb8b9ca368',
        isDeleted: false,
        isDeletable: false,
        taskSequence: [],
        children: [],
        visibleIf: [],
        hasSubTasks: false,
        learningResources: [
          {
            name: 'कोर्स का सारांश',
            link: 'https://diksha.gov.in/resources/play/content/do_31426519984232857613897',
            app: 'Diksha',
            id: 'do_31426519984232857613897',
          },
        ],
        deleted: false,
        type: 'content',
        name: 'शिक्षक कोर्स का सिंहावलोकन करें',
        externalId: 'BDGMIP-121-1748853154121',
        description: '',
        sequenceNumber: '1',
        updatedAt: '2025-06-27T11:45:22.241Z',
        createdAt: '2025-06-02T08:32:33.890Z',
        status: 'notStarted',
        referenceId: '683d61a13e09080008112135',
        isImportedFromLibrary: false,
        syncedAt: '2025-06-27T11:45:22.242Z',
      },
      {
        _id: 'c8730fea-4a0e-4c36-a675-9e5e084d33b1',
        createdBy: '140558b9-7df4-4993-be3c-31eb8b9ca368',
        updatedBy: '140558b9-7df4-4993-be3c-31eb8b9ca368',
        isDeleted: false,
        isDeletable: false,
        taskSequence: [],
        children: [],
        visibleIf: [],
        hasSubTasks: false,
        learningResources: [
          {
            name: 'गतिविधि',
            link: 'https://diksha.gov.in/resources/play/content/do_31426520252227584015164',
            app: 'Diksha',
            id: 'do_31426520252227584015164',
          },
        ],
        deleted: false,
        type: 'content',
        name: 'शिक्षक गतिविधि- जोड़ियों में पढ़ना, साझा पठन कहानी वाचन की समझ बनायेंगे',
        externalId: 'BDGMIP-2121-1748853154121',
        description: '',
        sequenceNumber: '2',
        updatedAt: '2025-06-27T11:45:22.242Z',
        createdAt: '2025-06-02T08:32:33.892Z',
        status: 'notStarted',
        referenceId: '683d61a13e09080008112138',
        isImportedFromLibrary: false,
        syncedAt: '2025-06-27T11:45:22.242Z',
      },
    ],
    learningResources: [],
    hasAcceptedTAndC: false,
    taskSequence: [
      'BDGMIP-121-1748853154121',
      'BDGMIP-2121-1748853154121',
      'BDGMIP-332-1748853154121',
      'BDGMIP-4121-1748853154121',
    ],
    recommendedFor: [
      {
        roleId: '5f32d8238e0dc831240405a0',
        code: 'HM',
      },
    ],
    attachments: [],
    deleted: false,
    description: 'Testing this project for Sanity',
    title: 'Project without certificate',
    solutionId: '683d61a23d8d030008f75971',
    solutionExternalId: 'BDGMIP-1211-1748853154121-PROJECT-SOLUTION',
    programId: '683d61873d8d030008f75934',
    programExternalId: 'testing_for_app_02_06_2025',
    isAPrivateProgram: false,
    appInformation: {
      appName: 'prod.diksha.portal',
    },
    entityId: '21e12c05-adb3-4a7f-89d0-4b03aa32be70',
    lastDownloadedAt: '2025-06-27T11:45:22.278Z',
    entityName: 'AMBASSA COLONY JUNIOR BASIC SCHOOL',
    programName: 'Testing program with project resources tripura',
    goal: 'TEMP',
    rationale: '',
    primaryAudience: '',
    duration: '4 Weeks',
    successIndicators: '',
    risks: '',
    approaches: '',
  },
};
