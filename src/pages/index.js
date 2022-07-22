// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Box from '@mui/material/Box'

// ** Demo Components Imports
import BlessingCard2 from 'src/views/cards/BlessingCard2'


import { useEffect, useState } from "react"
import { Divider, Slider } from '@mui/material'

const Market = () => {

    const [categoriesWithItems, setCategoriesWithItems] = useState([])

    useEffect(() => {
        fetch('/api/items')
          .then((res) => res.json())
          .then((data) => {
            setCategoriesWithItems(data)
          })
      }, [])

    return (
        <Box>
        {categoriesWithItems?.map((item) => (
            <Box key={item.type}>
                <Grid container spacing={6}>
                    <Grid item xs={12}>
                        <Typography variant='h5'>
                        <Link href={'/category?category=' + item.type}>
                            {item.type}
                        </Link>
                        </Typography>
                        <Typography variant='body2' className='mui-ellipsis'>{item.description}</Typography>
                    </Grid>
                    {item.items?.map((blessing) => (
                        <Grid key={blessing.image} item xs={12} md={2}>
                            <BlessingCard2 blessing={blessing} />
                        </Grid>
                    ))}
                    
                </Grid>
                <Divider sx={{marginTop: 5}}/>
            </Box>
        ))}
        
        </Box>
    )
}

export default Market
