// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip';
import TodayIcon from '@mui/icons-material/Today';


// ** Demo Components Imports
import BlessingCard from 'src/views/cards/BlessingCard'
import Divider from '@mui/material/Divider'
import ProductHeroLayout from 'src/layouts/ProductHeroLayout'

import {getCurrentDate} from 'src/@core/utils/date'

import { useEffect, useState } from "react"

const BlessingDay = () => {

    const [blessingDay, setBlessingDay] = useState({})


    useEffect(() => {
        fetch(`/api/blessing-day?day=${getCurrentDate()}`)
          .then((res) => res.json())
          .then((data) => {
            setBlessingDay(data)
          })
      }, [])

    return (
        <Box>
            <ProductHeroLayout
            sxBackground={{
                backgroundImage: `url(${'/images/banners/' + blessingDay.banner})`,
                backgroundColor: '#7fc7d9', // Average color of the background image.
                backgroundPosition: 'center',
            }}
            >
            {/* Increase the network loading priority of the background image. */}
            <img
                style={{ display: 'none' }}
                src={'/images/banners/' + blessingDay.banner}
                alt="increase priority"
            />
            <Typography color="inherit" align="center" variant="h2" marked="center">
                {blessingDay.title}
            </Typography>
            <Typography
                color="inherit"
                align="center"
                variant="h5"
                sx={{ mb: 4, mt: { sx: 4, sm: 10 } }}
            >
                {blessingDay.description}
            </Typography>
            <Chip icon={<TodayIcon />} label={blessingDay.day} color='primary'/>
            </ProductHeroLayout>
            <Divider />
            <Grid container spacing={6}>
                {blessingDay.items?.map((blessing) => (
                    <Grid key={blessing.image} item xs={12} sm={6} md={4}>
                        <BlessingCard blessing={blessing} />
                    </Grid>
                ))}   
            </Grid>
        </Box>
        
    )
}

export default BlessingDay
