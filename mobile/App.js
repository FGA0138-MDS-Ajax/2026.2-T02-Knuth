import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LinhasScreen from './src/screens/LinhasScreen';
import HorariosScreen from './src/screens/HorariosScreen';
import ItinerarioScreen from './src/screens/ItinerarioScreen';
import BuscarTrajetoScreen from './src/screens/BuscarTrajetoScreen';
import ResultadoTrajetoScreen from './src/screens/ResultadoTrajetoScreen';
import TrajetoDetalheScreen from './src/screens/TrajetoDetalheScreen';

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
        <Stack.Screen
          name="Itinerario"
          component={ItinerarioScreen}
          options={{ title: 'Itinerário' }}
        />
        <Stack.Screen
          name="BuscarTrajeto"
          component={BuscarTrajetoScreen}
          options={{ title: 'Planejar Viagem' }}
        />
        <Stack.Screen
          name="ResultadoTrajeto"
          component={ResultadoTrajetoScreen}
          options={{ title: 'Resultados' }}
        />
        <Stack.Screen
          name="TrajetoDetalhe"
          component={TrajetoDetalheScreen}
          options={{ title: 'Detalhes do Trajeto' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);