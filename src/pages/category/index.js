// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Box from '@mui/material/Box'

// ** Demo Components Imports
import BlessingCard2 from 'src/views/cards/BlessingCard2'

import { useEffect, useState } from "react"
import { useRouter } from 'next/router'
import IconButton from '@mui/material/IconButton';
import { Button, Divider, Slider } from '@mui/material'
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

const Category = () => {

    const [categoriesWithItems, setCategoriesWithItems] = useState([])
    const router = useRouter()
    const { category } = router.query

    useEffect(() => {
        if (category) {
            fetch('/api/items?category=' + category)
            .then((res) => res.json())
            .then((data) => {
              setCategoriesWithItems(data.filter((item) => item.type === category))
            })
        }
      }, [category])

    return (
        <Box>
        {categoriesWithItems?.map((item) => (
            <Box key={item.type}>
                <Grid container spacing={6}>
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            >
                            <Typography variant='h5'>
                            {item.type}
                            </Typography>
                            <IconButton href='/market' aria-label="" size="large">
                                <KeyboardReturnIcon fontSize="inherit" />
                            </IconButton>
                        </Box>
                        

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

export default Category
