import { Pipe } from "@angular/core";

@Pipe({
    name: "slice"
})
export class SlicePipe {
    transform(value, num) {
        return value.toString().slice(0, num);
    }
}
