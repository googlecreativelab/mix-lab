import { Component, OnInit, Input } from '@angular/core';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {
  @Input() toggle: boolean = false;

  constructor(
    public eventsService: EventsService,
  ) { }

  ngOnInit() {
    this.eventsService.on('toggleLoader', (toggle) => {
      this.toggle = toggle;
    });
  }

}
