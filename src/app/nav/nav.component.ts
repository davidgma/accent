import { Component } from '@angular/core';
import { EventType, Router, RouterLink } from '@angular/router';
import { HomeIconComponent } from '../icons/home-icon/home-icon.component';
import { InfoIconComponent } from '../icons/info-icon/info-icon.component';
import { SettingsIconComponent } from '../icons/settings-icon/settings-icon.component';
import { DebugIconComponent } from '../icons/debug-icon/debug-icon.component';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  imports: [
        HomeIconComponent,
        InfoIconComponent,
        SettingsIconComponent,
        DebugIconComponent,
        RouterLink,
      ],
})
export class NavComponent {

  defaultColour = "black";
  selectedColour = "red";

  constructor() {
  }


}
