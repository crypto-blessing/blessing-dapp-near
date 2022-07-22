import Icon from '@material-ui/core/Icon';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
    imageIcon: {
        display: 'flex',
        height: 'inherit',
        width: 'inherit',
        padding: '3px',
    },
    iconRoot: {
        textAlign: 'center'
    }
});

export const BUSD_ICON = () => {
    const classes = useStyles();
    
    return (

        <Icon classes={{root: classes.iconRoot}}>
            <img className={classes.imageIcon} src="/images/cryptos/binance-usd-busd-logo.svg" alt='BUSD'/>
        </Icon>

    );
}

export const CBT_ICON = () => {
    const classes = useStyles();
    
    return (

        <Icon classes={{root: classes.iconRoot}}>
            <img className={classes.imageIcon} src="/images/logos/logo.png" alt='CBT'/>
        </Icon>

    );
}