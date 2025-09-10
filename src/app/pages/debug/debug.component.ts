import { Component, OnInit } from '@angular/core';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {

  constructor(public ls: LoggerService) {}

  ngOnInit(): void {
    this.ls.logged.subscribe((message) => {
      // console.log("message received: " + message)
      // this.messages.unshift(message);
    });
  }

}
