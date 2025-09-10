import { Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { InfoComponent } from './pages/info/info.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { DebugComponent } from './pages/debug/debug.component';

export const routes: Routes = [{ path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: MainComponent },
  { path: 'info', component: InfoComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'debug', component: DebugComponent },
  { path: '**', component: MainComponent }];
