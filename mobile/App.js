import React from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import RecuperarSenhaScreen from './src/screens/RecuperarSenhaScreen';
import ExcluirContaScreen from './src/screens/ExcluirContaScreen';
import LinhasScreen from './src/screens/LinhasScreen';
import HorariosScreen from './src/screens/HorariosScreen';
import ItinerarioScreen from './src/screens/ItinerarioScreen';
import BuscarTrajetoScreen from './src/screens/BuscarTrajetoScreen';
import ResultadoTrajetoScreen from './src/screens/ResultadoTrajetoScreen';
import TrajetoDetalheScreen from './src/screens/TrajetoDetalheScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import AlertasScreen from './src/screens/AlertasScreen';
import ReportarDivergenciaScreen from './src/screens/ReportarDivergenciaScreen';
import AdminScreen from './src/screens/AdminScreen';
import CriarAdminScreen from './src/screens/CriarAdminScreen';
import GerenciarUsuariosScreen from './src/screens/GerenciarUsuariosScreen';
import EditarUsuarioScreen from './src/screens/EditarUsuarioScreen';
import GerenciarAlertasScreen from './src/screens/GerenciarAlertasScreen';
import NovoAlertaScreen from './src/screens/NovoAlertaScreen';
import FavoritosScreen from './src/screens/FavoritosScreen';
import AnalisarReportesScreen from './src/screens/AnalisarReportesScreen';
import DetalheReporteScreen from './src/screens/DetalheReporteScreen';

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
          name="Alertas" 
          component={AlertasScreen} 
          options={{ title: 'Alertas de Serviço' }} 
        />
        <Stack.Screen
          name="ReportarDivergencia"
          component={ReportarDivergenciaScreen}
          options={{ title: 'Reportar Divergência' }}
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
          name="RecuperarSenha"
          component={RecuperarSenhaScreen}
          options={{ title: 'Recuperar Senha' }}
        />
        <Stack.Screen
          name="ExcluirConta"
          component={ExcluirContaScreen}
          options={{ title: 'Excluir Conta' }}
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
        <Stack.Screen name="GerenciarAlertas" component={GerenciarAlertasScreen} options={{ title: 'Alertas' }} />
        <Stack.Screen name="NovoAlerta" component={NovoAlertaScreen} options={{ title: 'Novo alerta' }} />
                <Stack.Screen name="Favoritos" component={FavoritosScreen} options={{ title: 'Favoritos', headerBackVisible: false, headerLeft: () => null }} />
        <Stack.Screen name="AnalisarReportes" component={AnalisarReportesScreen} options={{ title: 'Analisar Reportes' }} />
        <Stack.Screen name="DetalheReporte" component={DetalheReporteScreen} options={{ title: 'Análise do Reporte' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);