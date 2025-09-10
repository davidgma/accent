import { Component, Input } from '@angular/core';
import { Setting } from '../../services/settings.service';

@Component({
  selector: 'app-numeric-setting',
  templateUrl: './numeric-setting.component.html',
  styleUrls: ['./numeric-setting.component.scss']
})
export class NumericSettingComponent {
  @Input() setting = new Setting<number>("initial", "initial", 1, "OneDecimal");

  valueChanged() {

    let valueElement = <HTMLParagraphElement>document.getElementById("value");
    if (valueElement !== null) {
      if (valueElement.textContent !== null) {
        let value = Number.parseFloat(valueElement.textContent);
        value = Math.round(value * 10) / 10;

        if (!Number.isNaN(value)) {
          // this.setting.value = Number.parseFloat(valueElement.textContent);
          this.setting.value = value;
        }
      }
    }

  }

  increment() {
    this.setting.value = Math.round((this.setting.value + 0.1) * 10) / 10;
  }

  decrement() {
    this.setting.value = Math.round((this.setting.value - 0.1) * 10) / 10;
  }
}
