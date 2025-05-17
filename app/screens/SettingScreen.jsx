
import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  const settingsOptions = [
    {
      title: 'Account Settings',
      icon: '👤',
      onPress: () => navigation.navigate('AccountSettings'),
    },
    {
      title: 'Notification Settings',
      icon: '🔔',
      rightComponent: (
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: '#767577', true: '#6A0DAD' }}
        />
      ),
    },
    {
      title: 'Dark Mode',
      icon: '🌙',
      rightComponent: (
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#767577', true: '#6A0DAD' }}
        />
      ),
    },
    {
      title: 'Help & Support',
      icon: '❓',
      onPress: () => navigation.navigate('Help'),
    },
    {
      title: 'About App',
      icon: 'ℹ️',
      onPress: () => navigation.navigate('About'),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      
      <View style={styles.settingsList}>
        {settingsOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.itemLeft}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.itemText}>{item.title}</Text>
            </View>
            {item.rightComponent && (
              <View style={styles.rightComponent}>
                {item.rightComponent}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 30,
  },
  settingsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 15,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  rightComponent: {
    marginLeft: 10,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;