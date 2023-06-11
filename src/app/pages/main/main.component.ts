import { Component } from '@angular/core';
import { AudioRecorderService } from 'src/app/services/audio-recorder.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {

  private audioAsBlob = new Blob();


  constructor(private audioRecorder: AudioRecorderService) { }

  status: Status = Status.Idle;

  ngOnInit() {
    window.addEventListener("focus", () => {
      console.log("Window gained focus");
      this.gainedFocus();
    });
    window.addEventListener("pageshow", () => {
      console.log("Window pageshow");
      this.gainedFocus();
    });
    window.addEventListener("blur", () => {
      console.log("Window lost focus");
      this.lostFocus();
    });
    window.addEventListener("pagehide", () => {
      console.log("Window pagehide");
      this.lostFocus();
    });
    document.onvisibilitychange = () => {
      if (document.visibilityState === "hidden") {
        console.log("Document hidden");
        this.lostFocus();
      }
      if (document.visibilityState === "visible") {
        console.log("Document visible");
        this.gainedFocus();
      }
    }

  }

  async lostFocus() {

    if (this.status === Status.Idle) {
      console.log("Already idle");
      return;
    }

    this.status = Status.Idle;
    await this.cancelRecording();

  }

  async gainedFocus() {

    if (this.status === Status.Monitoring) {
      console.log("Already monitoring");
      return;
    }

    this.status = Status.Monitoring;
    await this.startMonitoring();

  }

  async play() {
    if (this.audioAsBlob.size === 0) {
      return;
    }

    console.log("play");

    if (this.status === Status.Recording) {
      await this.stopRecording();
    }

    if (this.status === Status.Playing) {
      this.stopPlaying();
      this.startMonitoring();
    }
    else {
      await this.startPlaying();
      console.log("Finished playing audio");
      this.stopRecording();
    }

  }


  async record() {
    console.log("record");

    switch (this.status) {
      case Status.Idle:
        console.log("Error: shouldn't have been idle.");
        break;
      case Status.Monitoring:
        this.status = Status.Recording;
        await this.startRecording();
        break;
      case Status.Playing:
        this.stopPlaying();
        this.startMonitoring();
        this.startRecording();
        break;
      case Status.Recording:
        await this.stopRecording();
        await this.startMonitoring();
    }

  }

  async startMonitoring() {



    console.log("startMonitoring");


    await this.audioRecorder.ready;

    // Check the recorder is active
    if (this.audioRecorder.mediaRecorder.stream.active === false) {
      console.log("in startMonitoring: stream is inactive");
      this.audioRecorder.ready = this.audioRecorder.setupRecorder();
      await this.audioRecorder.ready;
    }

    console.log("Stream active: " + this.audioRecorder.mediaRecorder.stream.active);



    await this.audioRecorder.start()
      .then(() => { //on success

        //store the recording start time to display the elapsed time according to it
        this.audioRecordStartTime = new Date();

      })
      .catch((error: { message: string | string[]; name: string; }) => { //on error
        //No Browser Support Error
        if (error.message.includes("mediaDevices API or getUserMedia method is not supported in this browser.")) {
          console.log("To record audio, use browsers like Chrome and Firefox.");
        }

        //Error handling structure
        switch (error.name) {
          case 'AbortError': //error from navigator.mediaDevices.getUserMedia
            console.log("An AbortError has occurred.");
            break;
          case 'NotAllowedError': //error from navigator.mediaDevices.getUserMedia
            console.log("A NotAllowedError has occurred. User might have denied permission.");
            break;
          case 'NotFoundError': //error from navigator.mediaDevices.getUserMedia
            console.log("A NotFoundError has occurred.");
            break;
          case 'NotReadableError': //error from navigator.mediaDevices.getUserMedia
            console.log("A NotReadableError has occurred.");
            break;
          case 'SecurityError': //error from navigator.mediaDevices.getUserMedia or from the MediaRecorder.start
            console.log("A SecurityError has occurred.");
            break;
          case 'TypeError': //error from navigator.mediaDevices.getUserMedia
            console.log("A TypeError has occurred.");
            break;
          case 'InvalidStateError': //error from the MediaRecorder.start
            console.log("An InvalidStateError has occurred.");
            break;
          case 'UnknownError': //error from the MediaRecorder.start
            console.log("An UnknownError has occurred.");
            break;
          default:
            console.log("An error occurred with the error name " + error.name);
        };
      });

  }


  private async startRecording() {
    console.log("startRecording");

    // Discard any previous recording from the monitoring
    this.audioRecorder.audioBlobs = new Array<Blob>();
  }

  private async cancelRecording() {


    console.log("Cancelling recording...");
    //stop the recording using the audio recording API
    await this.audioRecorder.cancel();
    // console.log("Cancelled.");

  }

  private async stopRecording() {
    console.log("stopRecording");
    // Get the latest blob
    //save audio type to pass to set the Blob type
    if (this.audioRecorder.mediaRecorder !== null) {

      //add a dataavailable event listener in order to store the audio data Blobs when recording
      this.audioRecorder.mediaRecorder.addEventListener("dataavailable", event => {
        //store audio Blob object
        console.log("blob gathered");

        this.audioRecorder.audioBlobs.push(event.data);
        console.log("blobs size: " + this.audioRecorder.audioBlobs.length);
        let mimeType = this.audioRecorder.mediaRecorder.mimeType;
        this.audioAsBlob = new Blob(this.audioRecorder.audioBlobs, { type: mimeType });
      });

      this.audioRecorder.mediaRecorder.requestData();

    }

  }

  private async startPlaying() {
    return new Promise<void>((resolve, reject) => {
      console.log("startPlaying");
      this.status = Status.Playing;
      let audioElement = <HTMLAudioElement>document.getElementsByClassName("audio-element")[0];
      if (audioElement == null) {
        console.log("Error in startPlaying: audioElement is null");
        reject();
      }
      let audioElementSource = audioElement.getElementsByTagName("source")[0];
      if (audioElementSource == null) {
        audioElementSource = this.createSourceForAudioElement();
      }

      //read content of files (Blobs) asynchronously
      let reader = new FileReader();

      //once content has been read
      reader.onload = (e) => {
        //store the base64 URL that represents the URL of the recording audio
        if (e.target == null) {
          console.log("From startPlaying: Error: e.target is null");
          reject();
        }
        else {
          let base64URL = e.target.result;
          //If this is the first audio playing, create a source element
          //as pre populating the HTML with a source of empty src causes error
          // if (!this.audioElementSource) //if its not defined create it (happens first time only)

          //set the audio element's source using the base64 URL
          if (base64URL == null) {
            console.log("From startPlaying: Error: base64URL is null");
            reject();
            return;
          }

          audioElementSource.src = base64URL.toString();

          //set the type of the audio element based on the recorded audio's Blob type
          let BlobType = this.audioAsBlob.type.includes(";") ?
            this.audioAsBlob.type.substr(0, this.audioAsBlob.type.indexOf(';')) : this.audioAsBlob.type;
          audioElementSource.type = BlobType

          //call the load method as it is used to update the audio element after changing the source or other settings
          audioElement.load();

          //play the audio after successfully setting new src and type that corresponds to the recorded audio
          console.log("Playing audio...");
          if (audioElement != null) {
            audioElement.play().then(() => {
              audioElement?.addEventListener("ended", () => {
                // console.log("complete event");
                resolve();
              });
            });
          }

        };

      }

      //read content and convert it to a URL (base64)
      reader.readAsDataURL(this.audioAsBlob);

    });
  }

  private stopPlaying() {
    console.log("stopPlaying");
    let audioElement = <HTMLAudioElement>document.getElementsByClassName("audio-element")[0];
    if (audioElement != null) {
      audioElement.pause();
    }
  }

  /** Stores the actual start time when an audio recording begins to take place to ensure elapsed time start time is accurate*/
  private audioRecordStartTime = new Date();

  /** Stores the maximum recording time in hours to stop recording once maximum recording hour has been reached */
  private maximumRecordingTimeInHours = 1;

  /** Stores the reference of the setInterval function that controls the timer in audio recording*/
  private elapsedTimeTimer: any = null;


  /* Creates a source element for the the audio element in the HTML document*/
  private createSourceForAudioElement(): HTMLSourceElement {

    let sourceElement = document.createElement("source");
    // console.log("sourceElement: " + JSON.stringify(sourceElement));

    let audioElement = <HTMLAudioElement>document.getElementsByClassName("audio-element")[0];
    // console.log("audioElement: " + JSON.stringify(audioElement));
    audioElement.appendChild(sourceElement);
    return sourceElement;

    // this.audioElementSource = sourceElement;
  }

}

enum Status {
  Idle = "Idle",
  Monitoring = "Monitoring",
  Recording = "Recording",
  Playing = "Playing",
}
