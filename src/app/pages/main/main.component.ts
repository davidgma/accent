import { Component } from '@angular/core';
import { EnvironmentMonitorService } from '../../services/environment-monitor.service';
import { LoggerService } from '../../services/logger.service';
import { PlaybackService, PlayingState } from '../../services/playback.service';
import { RecordingService, RecordingState } from '../../services/recording.service';
import { SettingEvent, SettingsService, Setting } from '../../services/settings.service';
import { MicComponent } from '../../icons/mic/mic.component';
import { PlayComponent } from '../../icons/play/play.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  imports: [MicComponent, PlayComponent]
})
export class MainComponent {
  private moduleName = 'MainComponent';

  // Colours for icons
  defaultColour = "black";
  selectedColour = "red";

  // Colour for main background
  backgroundColor = "ivory";

  iconSize = 8;
  justifyContent = "center";
  alignItems = "center";
  direction = "column";

  private audioAsBlob = new Blob();
  private playCount = 0;
  private audioBlobStartTime = 0;
  private lockedLostFocus;
  private lockedGainedFocus;

  constructor(public rs: RecordingService,
    public ps: PlaybackService,
    private ls: LoggerService,
    private em: EnvironmentMonitorService,
    private ss: SettingsService
  ) {

    this.lockedLostFocus = this.ls.lock(this.lostFocus, this);
    this.lockedGainedFocus = this.ls.lock(this.gainedFocus, this);

    let functionName = 'constructor';
    this.ls.log('Called.', this.moduleName, functionName, 1);

    // iOS doesn't seem to call a gainedFocus
    // at the start or after a refresh so
    // it needs to be done manually
    // this.ls.log('document has focus: ' + document.hasFocus(), this.moduleName, functionName, 1);
    // if (document.hasFocus()) {
    //   this.em.onFocus.emit();
    // }

    this.setIconPosition();
    this.setDirection();

  }

  ngOnInit() {

    // Start listening for events
    this.em.onFocus.subscribe(() => {
      this.lockedGainedFocus();
    });
    this.em.onUnfocus.subscribe(() => {
      this.lockedLostFocus();
    });

    // Setup the audio part - this can only be done once
    // the template is active
    this.ps.setupAudio();
    this.logStates();

  }

  private setIconPosition() {
    let s = <Setting<boolean>>this.ss.settings.get("centralIcon");
    if (s.value === true) {
      this.justifyContent = "center";
      this.alignItems = "center"
      this.iconSize = 20;
    }
    else {
      this.justifyContent = "left";
      this.alignItems = "top"
      this.iconSize = 8;
    }
  }

  private setDirection() {
    let p = <Setting<boolean>>this.ss.settings.get("portrait");
    if (p.value === true) {
      this.direction = "column";
    }
    else {
      this.direction = "row";
    }
  }

  
  async lostFocus() {
    let functionName = 'lostFocus';
    this.ls.log('Called. ', this.moduleName, functionName, 1);

    // this.sts.stopRequest.emit();
    await this.rs.stop();
    this.ls.log('Final. ', this.moduleName, functionName, 1);
  }

  
  async gainedFocus() {
    let functionName = 'gainedFocus';
    await this.rs.start();
    await this.rs.pause();
    this.ps.setupAudio();

  }

  private logStates() {
    let functionName = 'logStates';
    this.ls.logState.emit();
  }

  async togglePlay() {
    let functionName = 'togglePlayLocked';
    this.ls.log('Called.', this.moduleName, functionName, 1);

    // Assume that any additional spurious calls
    // e.g. from mousedown and click
    // will happen within a short period of time
    return new Promise<void>(async (resolve, reject) => {
      this.play(); // don't await because we need to be able to cancel
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }

  private async play() {
    let functionName = 'play';
    this.ls.log('play', this.moduleName, functionName);

    return new Promise<void>(async (resolve, reject) => {

      // Cancel any audio currently playing
      if (this.ps.state === PlayingState.Playing) {
        this.ps.cancel();
        this.backgroundColor = "ivory";
        resolve();
        return;
      }

      // If it's currently recording, stop the
      // recording and wait for the blob to be ready,
      // and give it a little extra time to finish
      if (this.rs.state === RecordingState.Recording) {

        // Give it a little time to finish
        await new Promise(resolve => setTimeout(resolve, 200));

        let blob = await this.rs.getData();
        this.audioAsBlob = blob;
        this.audioBlobStartTime = this.rs.currentTime;
        this.rs.pause();
        this.playAudioBlob();
      }
      else if (this.audioAsBlob.size !== 0) {
        this.playAudioBlob();
      }
      resolve();
    });

  }

  private async playAudioBlob() {
    let functionName = 'playAudioBlob';

    this.backgroundColor = "mediumseagreen";
    await this.ps.play(this.audioAsBlob,
      //this.rs.currentTime
      this.audioBlobStartTime
      + this.ss.settings.get("playDelay")?.value);
      this.ls.log('Finished playing audio blob', this.moduleName, functionName);
      this.backgroundColor = "ivory";

    // refresh if necessary
    this.playCount++;
    // Refresh the recording service if playcount reached
    let refresh = this.ss.settings.get("refresh")?.value;
    if (refresh !== null && refresh !== 0 && this.playCount >= refresh) {
      this.playCount = 0;
      this.rs.refresh();
    }
  }

  async toggleRecord() {
    let functionName = 'toggleRecordLocked';
    this.ls.log('Called.', this.moduleName, functionName, 1);

    // Assume that any additional spurious calls
    // e.g. from mousedown and click
    // will happen within a short period of time
    return new Promise<void>(async (resolve, reject) => {
      this.record(); // don't await because we need to be able to cancel
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }

  private async record() {
    let functionName = 'record';
    this.ls.log('record', this.moduleName, functionName);

    return new Promise<void>(async (resolve, reject) => {

      // Stop any current playing audio
      if (this.ps.state === PlayingState.Playing) {
        this.ps.cancel();
      }

      switch (this.rs.state) {
        case RecordingState.Paused:
          this.backgroundColor = "firebrick";
          this.rs.start();
          break;
        case RecordingState.Recording:
          this.backgroundColor = "ivory";
          this.rs.getData().then((data) => {
            this.audioAsBlob = data;
            this.audioBlobStartTime = this.rs.currentTime;
          });
          this.rs.pause();
          break;
        case RecordingState.Stopped:
          this.backgroundColor = "firebrick";
          this.rs.start();
          break;
        case RecordingState.UnInitialized:
          this.backgroundColor = "firebrick";
          this.rs.start();
      }
    });

  }

  recordClick() {
    let functionName = 'recordClick';
    this.ls.log('Called.', this.moduleName, functionName, 1);
    this.toggleRecord();
  }

  playClick() {
    let functionName = 'playClick';
    this.ls.log('Called.', this.moduleName, functionName, 1);
    this.togglePlay();
  }

}

/*
 (drag)="recordDrag()"
    (dblclick)="recordDblClick()"
    (touchmove)="recordTouchmove()"
    (touchstart)="recordTouchstart()"
    (mousedown)="recordMousedown()"

    (drag)="playDrag()"
    (dblclick)="playDblClick()"
    (touchmove)="playTouchmove()"
    (touchstart)="playTouchstart()"
    (mousedown)="playMousedown()"

*/


