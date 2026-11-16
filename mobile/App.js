import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import LinhasScreen from './src/screens/LinhasScreen';
import HorariosScreen from './src/screens/HorariosScreen';
import ItinerarioScreen from './src/screens/ItinerarioScreen';
import BuscarTrajetoScreen from './src/screens/BuscarTrajetoScreen';
import ResultadoTrajetoScreen from './src/screens/ResultadoTrajetoScreen';
import TrajetoDetalheScreen from './src/screens/TrajetoDetalheScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import AdminScreen from './src/screens/AdminScreen';
import CriarAdminScreen from './src/screens/CriarAdminScreen';
import GerenciarUsuariosScreen from './src/screens/GerenciarUsuariosScreen';
import EditarUsuarioScreen from './src/screens/EditarUsuarioScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Linhas"
        screenOptions={{
          headerStyle: { backgroundColor: '#006666' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Linhas"
          component={LinhasScreen}
          options={{ 
            title: 'RotasDF - Linhas',
            headerBackVisible: false,
            headerLeft: () => null
          }}
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
        <Stack.Screen 
          name="Configuracoes" 
          component={ConfiguracoesScreen} 
          options={{ title: 'Configurações' }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Entrar na Conta' }} 
        />
        <Stack.Screen 
          name="Cadastro" 
          component={CadastroScreen} 
          options={{ title: 'Criar Conta' }} 
        />
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: 'Área do Administrador' }}
        />
        <Stack.Screen
          name="CriarAdmin"
          component={CriarAdminScreen}
          options={{ title: 'Novo Administrador' }}
        />
        <Stack.Screen name="GerenciarUsuarios" component={GerenciarUsuariosScreen} options={{ title: 'Usuários' }} />
        <Stack.Screen name="EditarUsuario" component={EditarUsuarioScreen} options={{ title: 'Editar usuário' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);