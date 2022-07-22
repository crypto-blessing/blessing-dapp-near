export const toLocaleDateFromBigInt = (dateFromBigInt) => {
    const date = new Date(parseInt(dateFromBigInt?.toString())*1000);

    let newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);

    const offset = newDate.getTimezoneOffset() / 60;
    const hours = newDate.getHours();

    newDate.setHours(hours - offset);

    return newDate.toLocaleString();  
}


export const getCurrentDate = () => {
    // 获取当前日期
    var date = new Date();

    // 获取当前月份
    var nowMonth = date.getMonth() + 1;

    // 获取当前是几号
    var strDate = date.getDate();

    // 添加分隔符“-”
    var seperator = "-";

    // 对月份进行处理，1-9月在前面添加一个“0”
    if (nowMonth >= 1 && nowMonth <= 9) {
    nowMonth = "0" + nowMonth;
    }

    // 对月份进行处理，1-9号在前面添加一个“0”
    if (strDate >= 0 && strDate <= 9) {
    strDate = "0" + strDate;
    }

    // 最后拼接字符串，得到一个格式为(yyyy-MM-dd)的日期
    var nowDate = date.getFullYear() + seperator + nowMonth + seperator + strDate;
    
    return nowDate;
}