import { Component } from '@angular/core';
import { Setting, SettingsService } from '../../services/settings.service';
import { BooleanSettingComponent } from '../../utils/boolean-setting/boolean-setting.component';
import { NumericSettingComponent } from '../../utils/numeric-setting/numeric-setting.component';
import { IntSettingComponent } from '../../utils/int-setting/int-setting.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [BooleanSettingComponent, 
    NumericSettingComponent,
  IntSettingComponent]
})
export class SettingsComponent {
  constructor(public ss: SettingsService) { }

  // isBoolean(value: any): boolean { return (typeof value === "boolean") }

  // isNumeric(value: any): boolean { return (typeof value === "number") }

  settingType(setting: Setting<any>) {
    return setting.dataType;
  }
}
