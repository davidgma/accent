import { Component, Input } from '@angular/core';
import { Setting } from '../../services/settings.service';

@Component({
  selector: 'app-boolean-setting',
  templateUrl: './boolean-setting.component.html',
  styleUrls: ['./boolean-setting.component.scss']
})
export class BooleanSettingComponent {
  @Input() setting = new Setting<boolean>("initial", "initial", true, "Boolean");

  value = false;

  ngOnInit(): void {
    this.value = this.setting.value;
  }

  change() {
    this.setting.value = !this.setting.value;
  }
}
