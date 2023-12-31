import { EventEmitter, Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class RecordingService {
  private moduleName = 'RecordingService';

  private static recorderCount = 0;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  state: RecordingState = RecordingState.UnInitialized;
  stateChange = new EventEmitter<RecordingState>();
  private dataReady = new EventEmitter<Blob>();
  private blobs = new Array<Blob>();
  private mimeType: string | undefined = undefined;

  // To stop a function running more than once at the same time
  private isInitialized = false;
  private initialized = new EventEmitter<void>();

  private startTime = new Date();
  private latestRecordingDuration = 0; // milliseconds
  public currentTime = 0; // seconds, time to start playing

  constructor(private ls: LoggerService) {
    this.stateChange.emit(RecordingState.UnInitialized);
    this.monitorTime();
    // this.monitorState();
  }

  // Initialize the MediaRecorder
  private async initialize() {
    let functionName = 'initialize';

    return new Promise<void>(async (resolve, reject) => {
      //Feature Detection
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        //Feature is not supported in browser
        //return a custom error
        this.ls.log('Error in RecordingService initialize: mediaDevices API or getUserMedia method is not supported in this browser.', this.moduleName, functionName);
        reject();
        return;
      }
      //Feature is supported in browser
      const constraints: MediaTrackConstraints = {
        autoGainControl: false,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: false,
        sampleRate: 16000

      }
      navigator.mediaDevices.getUserMedia({
        audio: constraints

      }).then(async (stream) => {
        this.stream = stream;

        this.recorder = new MediaRecorder(stream);
        this.blobs = new Array<Blob>();
        this.monitorRecorder(this.recorder);
        RecordingService.recorderCount++;
        this.ls.log('recorderCount: ' + RecordingService.recorderCount, this.moduleName, functionName, 1);

        if (this.recorder.stream.active === false) {
          this.ls.log('Error in RecordingService initialize: stream not active', this.moduleName, functionName);
          reject();
          return;
        }
        else {
          await this.dataListener();
          this.state = RecordingState.Stopped;
          this.stateChange.emit(this.state);
        }
        this.ls.log('Final: ' + this.toString(), this.moduleName, functionName, 1);
        this.isInitialized = true;
        this.initialized.emit();
        resolve();
      });

    });

  }

  private async dataListener() {
    let functionName = 'dataListener';

    this.recorder?.addEventListener("dataavailable", (event) => {
      let blob: Blob = event.data;
      this.ls.log('dataavailable event triggered.', this.moduleName, functionName, 1);
      this.ls.log("blob gathered size: " + blob.size, this.moduleName, functionName);

      if (blob.size > 0) {
        this.blobs.push(blob);
        for (let b of this.blobs) {
          this.ls.log("blob sizes: " + b.size, this.moduleName, functionName);
        }
        let mimeType = this.recorder?.mimeType;
        // console.log("mimeType: " + mimeType);
        this.mimeType = mimeType;

        let combined = new Blob(this.blobs, { type: mimeType });
        this.ls.log("total size: " + combined.size, this.moduleName, functionName);

        // this.playBlob(combined);
        this.dataReady.emit(combined);
        // }
      }
    });
  }

  async start() {
    let functionName = 'start';
    this.ls.log('Called ' + this.toString(), this.moduleName, functionName, 1);

    return new Promise<void>(async (resolve, reject) => {

      if (!this.isInitialized) {
        await this.initialize();
      }
      // should be initialized by now
      switch (this.state) {
        case RecordingState.UnInitialized:
          this.ls.log('Error: Should be initialized by here.', this.moduleName, functionName, 1);
          break;
        case RecordingState.Recording:
          break;
        case RecordingState.Paused:
          this.recorder?.resume();
          break;
        case RecordingState.Stopped:
          this.recorder?.start();
          break;
      }

      if (this.recorder?.state !== "recording") {
        this.ls.log("Error in RecordingService start: Failed to record.", this.moduleName, functionName);
      }
      else {
        if (this.state !== RecordingState.Recording) {
          this.state = RecordingState.Recording;
          this.stateChange.emit(this.state);
        }
      }
      this.ls.log('Final: ' + this.toString(), this.moduleName, functionName, 1);
      resolve();

    });

  }

  async stop() {
    let functionName = 'stop';
    this.ls.log(this.toString(), this.moduleName, functionName);

    return new Promise<void>(async (resolve, reject) => {
      switch (this.state) {
        case RecordingState.UnInitialized:
          // this.ls.log('Error: Should be initialized by here.', this.moduleName, functionName, 1);
          break;
        case RecordingState.Recording:
          this.stopAll();
          break;
        case RecordingState.Paused:
          this.stopAll();
          break;
        case RecordingState.Stopped:
          break;
      }

      if (this.recorder?.state !== "inactive") {
        this.ls.log("Error: Failed to stop.", this.moduleName, functionName);
      }
      else {
        if (this.state !== RecordingState.Stopped) {
          this.state = RecordingState.Stopped;
          this.stateChange.emit(this.state);
        }
      }
      this.ls.log('Final: ' + this.toString(), this.moduleName, functionName, 1);
      resolve();
    });

  }

  async pause() {
    let functionName = 'pause';
    this.ls.log('Called.', this.moduleName, functionName, 1);

    return new Promise<void>(async (resolve, reject) => {

      if (!this.isInitialized) {
        await this.initialize();
      }
      // should be initialized by now
      switch (this.state) {
        case RecordingState.UnInitialized:
          this.ls.log('Error: Should be initialized by here.', this.moduleName, functionName, 1);
          break;
        case RecordingState.Recording:
          this.recorder?.pause();
          break;
        case RecordingState.Paused:
          break;
        case RecordingState.Stopped:
          this.ls.log('State was stopped. Calling pause...', this.moduleName, functionName, 1);
          this.ls.log('recorder.state: ' + this.recorder?.state, this.moduleName, functionName, 1);
          try {
            this.recorder?.pause();
          }
          catch (error) {
            this.ls.log('Error trying to pause the recorder: ' + error, this.moduleName, functionName, 1);
          }
          break;
      }

      this.ls.log('State now: ' + this.recorder?.state, this.moduleName, functionName, 1);

      if (this.recorder?.state !== "paused") {
        this.ls.log('Error: Failed to pause.', this.moduleName, functionName);
      }
      else {
        this.ls.log('Is now paused. this.state: ' + this.state, this.moduleName, functionName, 1);
        if (this.state !== RecordingState.Paused) {
          this.ls.log('Setting state to paused...', this.moduleName, functionName, 1);
          this.state = RecordingState.Paused;
          this.stateChange.emit(this.state);
        }

      }
      this.ls.log('Final: ' + this.toString(), this.moduleName, functionName, 1);
      resolve();
    });



  }

  async refresh() {
    await this.stop();
    await this.start();
    await this.pause();
  }

  async getData(): Promise<Blob> {
    let functionName = 'getData';

    this.ls.log('Called', this.moduleName, functionName, 1);

    return new Promise<Blob>((resolve, reject) => {

      // It should be recording
      if (this.state !== RecordingState.Recording) {
        this.ls.log('Error: Not recording.' + this.toString(), this.moduleName, functionName);
        reject();
        return;
      }

      // Request data from recorder
      let sub = this.dataReady.subscribe((blob) => {
        this.ls.log('Blob received size ' + blob.size, this.moduleName, functionName, 1);
        sub.unsubscribe();
        resolve(blob);
      });
      this.ls.log('this.recorder?.state: ' + this.recorder?.state, this.moduleName, functionName, 1);
      // this.recorder?.pause();
      this.ls.log('Number of audio tracks: '
        + this.stream?.getAudioTracks().length, this.moduleName, functionName, 1);
      this.ls.log('stream settings: ' + JSON.stringify(this.stream?.getAudioTracks()[0].getSettings()), this.moduleName, functionName, 1);

      this.recorder?.requestData();
      // this.recorder?.resume();

    });

  }

  private stopAll() {
    let functionName = 'stopAll';

    this.ls.log('Stopping media recorder...', this.moduleName, functionName);
    this.recorder?.stop();
    //stop all the tracks on the active stream in order to stop the stream
    this.stopStream();

    this.ls.log('Should be stopped. ' + this.toString(), this.moduleName, functionName, 1);

    this.isInitialized = false;
    this.currentTime = 0;
    this.ls.log('Current time should be 0: ' + this.currentTime, this.moduleName, functionName, 1);
    this.startTime = new Date();
    this.latestRecordingDuration = 0; // milliseconds
    this.ls.log('latestRecordingDuration should be 0: ' + this.latestRecordingDuration, this.moduleName, functionName, 1);
  }

  /* Stop all the tracks on the active stream in order to stop the stream and remove
  * the red flashing dot showing in the tab
  */
  private stopStream() {

    //stopping the capturing request by stopping all the tracks on the active stream
    this.stream?.getTracks() //get all tracks from the stream
      .forEach(track /*of type MediaStreamTrack*/ => track.stop()); //stop each one
  }

  toString() {
    let status = "state: " + this.state
      + ", initialized: " + this.isInitialized
      + ", recorder: " + (this.recorder === null ? "null" : "instance")
      + ", stream: " + (this.stream === null ? "null" : "instance")
      + ", stream: " + (this.stream?.active ? "active" : "inactive")
      + ", MediaRecorder state: " + this.recorder?.state
      + ", number of tracks: " + this.stream?.getTracks().length
      + ", track 1: " + this.stream?.getTracks()[0].readyState;
    return status;
  }

  private monitorTime() {
    let functionName = 'monitorTime';

    this.stateChange.subscribe((state: RecordingState) => {
      if (state === RecordingState.Recording) {
        // move the currentTime forward
        this.ls.log('RecordingState changed to Recording. Initial currentTime: ' + this.currentTime + ". Initial latestRecordingDuration: " + this.latestRecordingDuration + ".", this.moduleName, functionName, 1);
        this.currentTime += this.latestRecordingDuration / 1000;
        this.ls.log('RecordingState changed to recording. Amended currentTime: ' + this.currentTime + ". Amended latestRecordingDuration: " + this.latestRecordingDuration + ".", this.moduleName, functionName, 1);
        // set the start time to measure the latest recording
        this.startTime = new Date();
      }

      if (state === RecordingState.Paused) {
        this.ls.log('RecordingState changed to Paused. Initial latestRecordingDuration: ' + this.latestRecordingDuration + ".", this.moduleName, functionName, 1);
        let ended = new Date();
        this.latestRecordingDuration =
          (ended.valueOf() - this.startTime.valueOf());
        this.ls.log('RecordingState changed to Paused. Amended latestRecordingDuration: ' + this.latestRecordingDuration + ".", this.moduleName, functionName, 1);
        this.ls.log("total recording length in seconds: " + (this.currentTime + this.latestRecordingDuration / 1000).toString(), this.moduleName, functionName);
      }
    });
  }

  getMimeType(): string {

    let ret = "Undefined: No recording data yet."
    if (this.mimeType !== undefined) {
      ret = this.mimeType;
    }
    // console.log("in getMimeType, returning " + ret);
    return ret;
  }

  private monitorRecorder(recorder: MediaRecorder) {
    this.recorderListen("dataavailable", recorder);
    this.recorderListen("error", recorder);
    this.recorderListen("pause", recorder);
    this.recorderListen("resume", recorder);
    this.recorderListen("start", recorder);
    this.recorderListen("stop", recorder);
  }

  private recorderListen(name: string, recorder: MediaRecorder) {
    let functionName = 'recorderListen';

    recorder.addEventListener(name, async (event) => {
      this.ls.log(name + ' event emitted: '
        + JSON.stringify(event), this.moduleName, functionName, 1);

    });
  }

}

export enum RecordingState {
  UnInitialized = "UnInitialized",
  Stopped = "Stopped",
  Recording = "Recording",
  Paused = "Paused"
}


//
//
//
//
//
//

