import { Pipe } from "@angular/core";

@Pipe({
    name: "padTime"
})
export class PadTimePipe {
    transform(value) {
        return `00${value}`.slice(-2);
    }
}
