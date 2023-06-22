import { EventEmitter, Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private moduleName = 'SettingsService';


  settings: Map<string, Setting<any>>;

  constructor(private ls: LoggerService) {
    let functionName = 'constructor';

    this.settings = new Map<string, Setting<any>>();

    // Whether to show the record and play icons
    // as big and central or smaller and at the top left
    let centralIcon = new Setting<boolean>(
      "Central icon",
      "Show the record and play icons in the centre (otherwise they will be displayed at the top left",
      true);
    this.settings.set("centralIcon", centralIcon);
    centralIcon.onChange.subscribe((event) => {
      this.ls.log('centralIcon setting changed from '
      + event.from + " to " + event.to, this.moduleName, functionName, 1);
    });

    // Debugging level
    let debugging = new Setting<number>(
      "Debugging level",
      "Debugging level: 0 = none, 1 = normal, 2 = specific.",
      1);
    this.settings.set("debugging", debugging);
    debugging.onChange.subscribe((event) => {
      this.ls.log('debugging level setting changed from '
        + event.from + " to " + event.to, this.moduleName, functionName, 1);
      this.ls.debug = event.to;
    });
  }
}

export class Setting<Type> {

  onChange = new EventEmitter<SettingEvent<Type>>();

  constructor(public name: string = "initial", public description: string = "initial description", private settingValue: Type) { }

  get value(): Type {
    return this.settingValue;
  }

  set value(newValue: Type) {

    let event: SettingEvent<Type> = {
      "name": this.name,
      "from": this.settingValue,
      "to": newValue
    }

    this.settingValue = newValue;
    this.onChange.emit(event);
  }
}

export interface SettingEvent<Type> {
  name: string;
  from: Type;
  to: Type;
}




