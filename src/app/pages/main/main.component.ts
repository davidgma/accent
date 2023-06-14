import { Component, EventEmitter } from '@angular/core';
import { LoggerService } from 'src/app/services/logger.service';
import { PlaybackService, PlayingState } from 'src/app/services/playback.service';
import { RecordingService, RecordingState } from 'src/app/services/recording.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  private moduleName = 'MainComponent';

  // Colours for icons
  defaultColour = "black";
  selectedColour = "red";

  // Colour for main background
  backgroundColor = "ivory";

  // To stop a function running more than once at the same time
  // private isGainingFocus = false;
  // private isLosingFocus = false;

  private audioAsBlob = new Blob();

  constructor(public rs: RecordingService, public ps: PlaybackService, private ls: LoggerService) { }

  ngOnInit() {
    let functionName = 'ngOnInit';

    // Set debug mode
    this.ls.debug = 1;

    window.addEventListener("focus", () => {
      this.ls.log('Window gained focus', this.moduleName, functionName);
      this.lockedGainedFocus();
    });
    window.addEventListener("pageshow", () => {
      this.ls.log('Window pageshow', this.moduleName, functionName);
      this.lockedGainedFocus();
    });
    window.addEventListener("blur", () => {
      this.ls.log('Window lost focus', this.moduleName, functionName);
      this.lockedLostFocus();
    });
    window.addEventListener("pagehide", () => {
      this.ls.log('Window pagehide', this.moduleName, functionName);
      this.lockedLostFocus();
    });
    document.onvisibilitychange = () => {
      if (document.visibilityState === "hidden") {
        this.ls.log('Document hidden', this.moduleName, functionName);
        this.lockedLostFocus();
      }
      if (document.visibilityState === "visible") {
        this.ls.log('Document visible', this.moduleName, functionName);
        this.lockedGainedFocus();
      }
    }

    // Setup the audio part - this can only be done once
    // the template is active
    this.ps.setupAudio();

    this.logStates();
    this.monitorStates();

  }

  private lockedLostFocus = this.lock(this.lostFocus);
  async lostFocus() {
    let functionName = 'lostFocus';
    this.ls.log('Called. ', this.moduleName, functionName, 1);

    // if (this.isLosingFocus === true) {
    //   return;
    // }
    // this.isLosingFocus = true;
    if (this.rs.state !== RecordingState.Stopped) {
      await this.rs.stop();
    }
    // this.isLosingFocus = false;
    this.ls.log('Final. ', this.moduleName, functionName, 1);
  }

  private lockedGainedFocus = this.lock(this.gainedFocus);
  async gainedFocus() {
    let functionName = 'gainedFocus';

    this.ls.log('Calling start...', this.moduleName, functionName, 1);
    await this.rs.start();
    this.ls.log('Calling pause...', this.moduleName, functionName, 1);
    await this.rs.pause();

  }

  private logStates() {
    let functionName = 'logStates';
    this.ls.log("RecordingService state: " + this.rs.state, this.moduleName, functionName);
    this.ls.log("PlaybackService state: " + this.ps.state, this.moduleName, functionName);
  }

  async play() {
    let functionName = 'play';
    this.ls.log('play', this.moduleName, functionName);

    return new Promise<void>(async (resolve, reject) => {

      // Cancel any audio currently playing
      if (this.ps.state === PlayingState.Playing) {
        this.ps.cancel();
        resolve();
        return;
      }

      // If it's currently recording, stop the
      // recording and wait for the blob to be ready
      if (this.rs.state === RecordingState.Recording) {
        let blob = await this.rs.getData();

        this.ps.play(blob, this.rs.currentTime);
      }
      else if (this.audioAsBlob.size === 0) {
        resolve();
        return;
      }
      else {
        await this.ps.play(this.audioAsBlob, this.rs.currentTime);
        this.ls.log('Finished playing audio', this.moduleName, functionName);
        resolve();
      }
      resolve();
    });


  }

  async record() {
    let functionName = 'record';
    this.ls.log('record', this.moduleName, functionName);

    return new Promise<void>(async (resolve, reject) => {
      // Check that the recorder is recording
      if (this.rs.state !== RecordingState.Recording) {
        await this.rs.start();
      }

      // Stop any current playing audio
      if (this.ps.state === PlayingState.Playing) {
        this.ps.cancel();
      }

      switch (this.rs.state) {
        case RecordingState.Paused:
          this.rs.start();
          break;
        case RecordingState.Recording:
          this.audioAsBlob = await this.rs.getData();
          this.ls.log('Blob received size ' + this.audioAsBlob.size, this.moduleName, functionName, 1);
          this.rs.pause();
          break;
        case RecordingState.Stopped:
          this.rs.start();
          break;
        case RecordingState.UnInitialized:
          this.rs.start();
      }
    });

  }

  // For stopping async methods from running more than once at the same time.
  private lock(decoratee: Function) {
    const decorated = async (...args: any[]) => {
      if (!decorated.locked) {
        decorated.locked = true;
        await decoratee.call(this, ...args);
        decorated.locked = false;
      }
    };

    // Defines the property locked
    decorated.locked = false;

    return decorated;
  }

  private monitorStates() {
    this.rs.stateChange.subscribe((state: RecordingState) => {
      switch (state) {
        case RecordingState.Paused:
          this.backgroundColor = "ivory";
          break;
        case RecordingState.Recording:
          this.backgroundColor = "firebrick";
          break;
        case RecordingState.Stopped:
          this.backgroundColor = "ivory";
          break;
      }
    });

    this.ps.stateChange.subscribe((state: PlayingState) => {
      switch (state) {
        case PlayingState.Playing:
          this.backgroundColor = "mediumseagreen";
          break;
        case PlayingState.Ready:
          this.backgroundColor = "ivory";
      }
    });

  }

}



