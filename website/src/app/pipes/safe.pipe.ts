import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer} from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url, args) {
    let safeURL;
    if (args === 'youtube') {
      safeURL = 'https://www.youtube.com/embed/' + url + '?rel=0&showinfo=0';
    } else {
      safeURL = url;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(safeURL);
  }
}
