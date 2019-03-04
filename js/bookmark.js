chrome.storage.sync.get('bookmarks', function(result) {
    if(result.bookmarks.length!==0){
        console.log(result.bookmarks);
        let bookmarks = [];
        result.bookmarks.forEach(function (element, index) {
            let iconFullURL= 'https://steamcommunity.com/economy/image/' + element.itemInfo.iconURL + '/256x256';
            let notify = element.notify;
            if(notify){
                notify = "checked";
                notifOptionsVisibility = "block";
            }
            else{
                notify = "";
                notifOptionsVisibility = "none";
            }
            let bookmark = `<div class="buildingBlock">
         <div class="row">
            <div class="col-5">
                <h3>${element.itemInfo.name}</h3>
                <h4>${element.itemInfo.exterior}</h4>
                <img src="${iconFullURL}">
            </div>
            <div class="col-4 mid-column" data-tradability="${element.itemInfo.tradability}">
                <h4 class="tradability" data-tradability="${element.itemInfo.tradability}">Tradable after ${new Date(element.itemInfo.tradability).toString().split("GMT")[0]}</h4>
                <h4 class="countdown" data-countdown="${element.itemInfo.tradability}"></h4>
                <div class="notifyDiv" data-tradability="${element.itemInfo.tradability}">
                <h4>Notify</h4> 
                <label class="switch">
                    <input type="checkbox" class="notify" data-index="${index}" ${notify}>
                    <span class="slider round"></span>
                </label>
                <div class="notifOptions" style="display: ${notifOptionsVisibility}" data-index="${index}">
                    <h5>How do you want to get notified?:</h5>
                    <select class="form-control" id="notifType">
                      <option value="chrome">Chrome desktop notification</option>
                      <option value="alert">Browser alert (to focus)</option>
                    </select>
                    <h5>When do you want to get notified?</h5>
                    <input type="number" id="numberOfMinutesOrHours" value="0">
                     <select class="form-control" id="minutesOrHours">
                      <option value="minutes">minutes</option>
                      <option value="hours">hours</option>
                    </select>
                    <select class="form-control" id="beforeOrAfter">
                      <option value="before">before</option>
                      <option value="after">after</option>
                    </select>
                    <span>the item becomes tradable</span>
                </div>
            </div>
            </div>
            <div class="col-3">
            <div style="text-align: right">
            <a href="https://steamcommunity.com/profiles/${element.owner}/" target="_blank"><i class="fas fa-chart-line whiteIcon" title="Open the item's Steam Market page"></i></a>
            <a href="https://steamcommunity.com/profiles/${element.itemInfo.marketlink}/" target="_blank"><i class="fas fa-link whiteIcon" title="Open the item in the owner's inventory"></i></a>
            <a href="https://steamcommunity.com/profiles/${element.owner}/" target="_blank"><i class="fas fa-user whiteIcon" title="Open the item's owner's profile page"></i></a>
            <i class="fas fa-trash remove" data-index="${index}" title="Remove the item from your bookmarks"></i>
            </div>
            <h4>Comment</h4>
                <textarea class="comment" data-index="${index}">${element.comment}</textarea>
            </div>
        </div>
        </div>`;
            bookmarks.push(bookmark);
        });

        $('#bookmarks').html(bookmarks);
        removeBookmarkListener();
        commentListener();
        setAlarms();
        addCountdowns();
        cleanUpElementsOnTradableItems();
    }
});

function removeBookmarkListener(){
    $('.remove').click(function () {
        let index = $(this).attr("data-index");
        chrome.storage.sync.get('bookmarks', function(result) {
            let assetid =result.bookmarks[index].itemInfo.assetid;
            result.bookmarks.splice(index, 1);
            chrome.storage.sync.set({'bookmarks': result.bookmarks}, function() {
                chrome.alarms.clear(assetid, function(){})
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.reload(tabs[0].id);
                });
            });
        });
    });
}

function commentListener(){
    $(".comment").on("change keyup paste", function(){
        let index = $(this).attr("data-index");
        let newcomment = $(this).val();
        chrome.storage.sync.get('bookmarks', function(result) {
            let bookmarks = result.bookmarks;
            bookmarks[index].comment=newcomment;
            chrome.storage.sync.set({bookmarks: bookmarks}, function() {
            });
        });
    });
}

function setAlarms(){
    $(".notify").click(function() {
        $notifSwitch = $(this);
        let index = $notifSwitch.attr("data-index");
        console.log($notifSwitch.parent().next());
        $notifSwitch.parent().next().toggle();
        chrome.storage.sync.get('bookmarks', function(result) {
            let bookmarks = result.bookmarks;
            if($notifSwitch[0].checked) {
                bookmarks[index].notify=true;
                chrome.storage.sync.set({bookmarks: bookmarks}, function() {
                    if(bookmarks[index].itemInfo.tradability!=="Tradable"){
                        chrome.runtime.sendMessage({setAlarm: {name:  bookmarks[index].itemInfo.assetid, when: bookmarks[index].itemInfo.tradability}}, function(response) {});
                    }
                });
            }
            else{
                bookmarks[index].notify=false;
                chrome.storage.sync.set({bookmarks: bookmarks}, function() {
                    chrome.alarms.clear(bookmarks[index].itemInfo.assetid, function(){})
                });
            }
        });
    });
}

function addCountdowns(){
    $( "[data-countdown]" ).each(function() {
        let $this = $(this);

        if(!(($this.attr("data-countdown")==='Tradable')||($this.attr("data-countdown")==='Non-Tradable'))){
            let countDownDate =  new Date($this.attr("data-countdown"));

            let x = setInterval(function() {
                let distance = countDownDate - Date.now();

                let days = Math.floor(distance / (1000 * 60 * 60 * 24));
                let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                let seconds = Math.floor((distance % (1000 * 60)) / 1000);

                $this.text(days + "d " + hours + "h "
                    + minutes + "m " + seconds + "s ");

                if (distance < 0) {
                    clearInterval(x);
                    $this.hide();
                }
            }, 1000);
        }
        else{
            $this.hide();
        }
    });
}

function cleanUpElementsOnTradableItems() {
    $(".mid-column").each(function(){
        let tradableElement = `<h4 class="tradable">Tradable</h4>`;
        let tradableAt = new Date($(this).attr("data-tradability"));
        if(tradableAt<Date.now()){
            $(this).html(tradableElement);
        }
    });
}