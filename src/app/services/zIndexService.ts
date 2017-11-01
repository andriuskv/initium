export class ZIndexService {
    zIndex: number = 1;

    inc() {
        this.zIndex += 1;
        return this.zIndex;
    }
}
