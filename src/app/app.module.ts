import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MainComponent } from './pages/main/main.component';
import { MicComponent } from './icons/mic/mic.component';
import { PlayComponent } from './icons/play/play.component';
import { InfoIconComponent } from './icons/info-icon/info-icon.component';
import { SettingsIconComponent } from './icons/settings-icon/settings-icon.component';
import { HomeIconComponent } from './icons/home-icon/home-icon.component';
import { NavComponent } from './nav/nav.component';
import { InfoComponent } from './pages/info/info.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { DebugIconComponent } from './icons/debug-icon/debug-icon.component';
import { DebugComponent } from './pages/debug/debug.component';
import { IconComponent } from './icons/icon/icon.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    MicComponent,
    PlayComponent,
    InfoIconComponent,
    SettingsIconComponent,
    HomeIconComponent,
    NavComponent,
    InfoComponent,
    SettingsComponent,
    DebugIconComponent,
    DebugComponent,
    IconComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
