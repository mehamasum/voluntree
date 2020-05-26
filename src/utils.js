import moment from "moment";

const formatTime = (time) => {
    var now = moment(new Date()); //todays date
    var end = moment(time); // another date
    var duration = moment.duration(now.diff(end));
    var days = duration.asDays();

    if(days < 2) {
        return moment(time).fromNow();
    } else {
        return moment(time).format('MMM Do YYYY');
    }
};

function truncateString(str, num) {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    } else {
        return str;
    }
}

function currentPage(path) {
    const paths = ['/']

}

export {
    formatTime,
    truncateString
}
