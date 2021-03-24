const express =require('express')
const connectDB =require('./config/db')
const bodyParser =require('body-parser')
const app =express()
  


app.use(express.json({ limit: '30mb', extended: true }))
connectDB()
app.get('/',(req,res)=> res.send('API is running '))
// app.use('/api/profile',require('./routes/api/proffile'))
app.use('/api/user',require('./routes/api/user'))
app.use('/api/profile',require('./routes/api/post'))
app.use('/api/auth',require('./routes/api/auth'))
app.use('/api/post',require('./routes/api/posts'))



const PORT =process.env.PORT|| 5000
  app.listen(PORT,()=>{

    console.log('server started')
  })