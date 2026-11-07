import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LinhasScreen from './src/screens/LinhasScreen';
import HorariosScreen from './src/screens/HorariosScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Linhas">
        <Stack.Screen
          name="Linhas"
          component={LinhasScreen}
          options={{ title: 'RotasDF - Linhas' }}
        />
        <Stack.Screen
          name="Horarios"
          component={HorariosScreen}
          options={{ title: 'Quadro de Horários' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);