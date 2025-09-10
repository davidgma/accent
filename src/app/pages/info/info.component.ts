import {
  APP_BASE_HREF, formatNumber, getLocaleId, formatDate,
  getCurrencySymbol,
  getLocaleCurrencyCode,
  registerLocaleData,
  formatCurrency,
  isPlatformBrowser,
  Location, LocationStrategy, PathLocationStrategy
} from '@angular/common';
import { Component, OnInit, Inject, LOCALE_ID, PLATFORM_ID } from '@angular/core';

import localeGb from '@angular/common/locales/en-GB';

import { PlaybackService, PlayingState } from '../../services/playback.service';
import { RecordingService, RecordingState } from '../../services/recording.service';
import { LoggerService } from '../../services/logger.service';
import { SettingsService } from '../../services/settings.service';


@Component({
  selector: 'app-info',
  providers: [Location, { provide: LocationStrategy, useClass: PathLocationStrategy }],
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {


  messages = new Array<string>();

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    @Inject(PLATFORM_ID) private platformId: string,
    // @Inject(APP_BASE_HREF) private appBaseHref: string,
    private location: Location,
    private ps: PlaybackService,
    private rs: RecordingService,
  private ss: SettingsService) {

  }

  ngOnInit(): void {

    // Version number
    this.messages.push("Accent version 0.23");
    this.messages.push("Recent change: new constraints");

    this.messages.push('User agent:' + navigator.userAgent);
    this.messages.push("window.webkitURL: " + window.webkitURL);
    this.messages.push("play/record layout direction: " + (this.ss.settings.get("portrait")?.value ? "portrait" : "landscape"));
    this.messages.push("debugging level: " + (this.ss.settings.get("debugging")?.value));

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.messages.push('devices: ' + JSON.stringify(devices));

    });


    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    for (const c of Object.keys(supportedConstraints)) {
      this.messages.push("Supported constraint: " + c);
    }
    // this.messages.push(JSON.stringify(supportedConstraints));


    // See Angular internationalization documentation.
    this.messages.push("LOCALE: " + this.locale);
    this.messages.push("LocaleId: " + getLocaleId(this.locale));
    // this.messages.push("APP_BASE_HREF: " + this.appBaseHref);

    // Local currency formatting
    // Note: may need: ng add @angular/localize
    registerLocaleData(localeGb);
    let currencySymbol = getCurrencySymbol(
      <string>getLocaleCurrencyCode(this.locale), "wide");
    this.messages.push("formatCurrency example: "
      + formatCurrency(40.429, this.locale, currencySymbol));


    // For date formats, see: https://angular.io/api/common/DatePipe
    let dateFormat = "dd-MM-yyyy HH:mm:ss";
    this.messages.push("formatDate example: " + formatDate(new Date(), dateFormat, this.locale));
    this.messages.push("formatNumber example: " + formatNumber(7, this.locale, "3.2"));

    // PLATFORM_ID
    this.messages.push("PLATFORM_ID: " + this.platformId);
    this.messages.push("isPlatformBrowser: " + isPlatformBrowser(this.platformId));

    // Location. This isn't helpful. Use the router.
    this.messages.push("location.pathname: " + location.pathname);



    if (this.ps.state === PlayingState.Ready) {
      this.messages.push("PlayingState is Ready. Getting info...");
    }

    if (this.rs.state !== RecordingState.UnInitialized) {
      this.messages.push("RecordingState is " + this.rs.state + ". Getting info...");
      this.messages.push("MimeType: " + this.rs.getMimeType());

    }



  }



}
