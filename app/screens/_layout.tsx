// App.js or Navigation.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ManageHostels from './AddHostel';
import HostelDetail from './HostelDetails';
import All from '../screens/admin/AllHostel';

const Stack = createStackNavigator();

export default function App() {
  return (
      <Stack.Navigator>
        <Stack.Screen name="ManageHostels" component={ManageHostels} />
        <Stack.Screen name="HostelDetail" component={HostelDetail} />
        <Stack.Screen name="AllHostels" component={All} />

        
      </Stack.Navigator>
  );
}
