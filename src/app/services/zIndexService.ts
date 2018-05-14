import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class ZIndexService {
    zIndex: number = 1;

    inc() {
        this.zIndex += 1;
        return this.zIndex;
    }

    incIfLess(zIndex) {
        if (zIndex < this.zIndex) {
            this.zIndex += 1;
        }
        return this.zIndex;
    }
}
