import { Pipe } from "@angular/core";

@Pipe({
    name: "padTime"
})
export class PadTimePipe {
    transform(value, pad = true) {
        return pad ? `00${value}`.slice(-2) : value;
    }
}
