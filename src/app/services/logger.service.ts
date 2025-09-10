import { EventEmitter, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private moduleName = 'LoggerService';

  // Event to request a log of states
  logState = new EventEmitter<void>();

  // This is set by MainComponent.ngOnInit
  debug = 1; // 0 - no debugging, 1 - general, 2 - specific
  logged = new EventEmitter<string>();
  messages = new Array<string>();

  constructor() { }

  log(message: string, moduleName: string, functionName: string, level = 1) {
    if (this.debug === level) {

      let now = new Date();
      let ts = now.getHours().toFixed().padStart(2, '0') + ":" + now.getMinutes().toFixed().padStart(2, '0')
        + ":" + now.getSeconds().toFixed().padStart(2, '0');
      let log = ts + " " + moduleName + " " + functionName + ":\n" + message;
      // console.log(log);
      this.messages.unshift(log);
      this.logged.emit(log);
    }
  }

  // For stopping async methods from running more than once at the same time.
  lock(decoratee: Function, callerThis: any) {
    let functionName = 'lock';
    this.log('Called by ' + decoratee.name, this.moduleName, functionName, 1);

    const decorated = async (...args: any[]) => {
      this.log('In decorated function of lock. decorated.locked: ' + decorated.locked, this.moduleName, functionName, 1);
      if (!decorated.locked) {
        decorated.locked = true;
        await decoratee.call(callerThis, ...args);
        decorated.locked = false;
      }
    };

    // Defines the property locked
    decorated.locked = false;

    return decorated;
  }
}
