import { Component, Input } from '@angular/core';
import { Setting } from '../../services/settings.service';


@Component({
  selector: 'app-int-setting',
  templateUrl: './int-setting.component.html',
  styleUrls: ['./int-setting.component.scss']
})
export class IntSettingComponent {
  @Input() setting = new Setting<number>("initial", "initial", 1, "Integer");

  valueChanged() {

    let valueElement = <HTMLParagraphElement>document.getElementById("value");
    if (valueElement !== null) {
      if (valueElement.textContent !== null) {
        let value = Number.parseInt(valueElement.textContent);

        if (!Number.isNaN(value)) {
          this.setting.value = Number.parseInt(valueElement.textContent);
        }
      }
    }

  }

  increment() {
    this.setting.value++;
  }

  decrement() {
    this.setting.value--;
  }
}
