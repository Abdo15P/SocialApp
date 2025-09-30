const clientIo= io("http://localhost:3000/",{
    auth: {authorization: "BearerToken"}
})

clientIo.om("connect",()=>{
    console.log(`Server connection established successfully`)
})

clientIo.om("connect_error",(error)=>{
    console.log(`Connection Error: ${error.message}`)
})

ClientIo.emit("sayHi","Hello from FE",(res)=>{
    console.log({res})
})