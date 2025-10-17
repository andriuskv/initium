export type Current = {
  location: string,
  temperature: number,
  humidity: number,
  precipitation: number,
  description: string,
  coords: { lat: number, lon: number },
  wind: {
    speed: { raw: number, value: number },
    direction: { name: string, degrees: number }
  },
  icon: string,
  iconId: string
}

export type Weekday = {
  id: string,
  description: string;
  icon: string;
  iconId: string;
  temperature: {
    min: number,
    max: number
  }
  weekday: string
};

export type Hour = {
  id: string,
  hour: number,
  time: string,
  temperature: number,
  tempC: number,
  precipitation: number,
  wind: {
    speed: {
      value: number,
      raw: number
    },
    direction: {
      name: string,
      degrees: number
    }
  }
}

export type View = "temperature" | "precipitation" | "wind";
