export interface FlightProps{
    _id?:string,
    departureCity:string,
    destinationCity:string,
    date: string,
    price: number,
    avaiableSeats:number,
    userId: string,
    status:number,
    version:number,
    imgPath:string,
    latitude:number,
    longitude:number
}