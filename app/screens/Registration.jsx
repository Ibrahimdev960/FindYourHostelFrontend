import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../src/redux/authSlice';
import { useNavigation } from '@react-navigation/native';

const Registration = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector(state => state.auth);

  const [role, setRole] = useState('Hostellite');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateInput = () => {
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let valid = true;

    if (!nameRegex.test(name)) {
      setNameError('Name should only contain alphabets.');
      valid = false;
    }

    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format.');
      valid = false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    }

    if (!phone || phone.length !== 11) {
      Alert.alert('Error', 'Phone number must be exactly 11 digits.');
      valid = false;
    }

    if (!name || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill all fields.');
      valid = false;
    }

    return valid;
  };

  const handleRegister = () => {
    if (!validateInput()) return;

    dispatch(registerUser({ name, email, phone, password, role }));
  };

  useEffect(() => {
    if (user) {
      Alert.alert('Success', 'Registration successful!');
      navigation.navigate('Login');
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Error', error);
    }
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Register</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Role</Text>
        <Picker
          selectedValue={role}
          style={styles.picker}
          onValueChange={(itemValue) => setRole(itemValue)}
        >
          <Picker.Item label="Hostellite (Student)" value="Hostellite" />
          <Picker.Item label="Hosteller (Hostel Owner)" value="Hosteller" />
        </Picker>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          placeholder="Enter your name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            const nameRegex = /^[A-Za-z\s]+$/;
            if (!nameRegex.test(text)) {
              setNameError('Name should only contain alphabets.');
            } else {
              setNameError('');
            }
          }}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(text)) {
              setEmailError('Invalid email format.');
            } else {
              setEmailError('');
            }
          }}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="11-digit phone number"
          keyboardType="numeric"
          maxLength={11}
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : null]}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (text.length < 8) {
              setPasswordError('Password must be at least 8 characters.');
            } else {
              setPasswordError('');
            }
          }}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>
          {loading ? 'Registering...' : 'Register'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkButtonText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6A0DAD',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#6A0DAD',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Registration;
