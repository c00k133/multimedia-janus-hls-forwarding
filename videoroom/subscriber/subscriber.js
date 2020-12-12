var server = "http://192.168.3.170:8088/janus"

var janus = null;
var sfutest = null;
var opaqueId = "videoroomtest-" + Janus.randomString(12);
var myroom = 1234;	// Demo room
var myusername = null;
var myid = null;
var mypvtid = null;

var mystream = null;
var feeds = [];
var bitrateTimer = [];
var senderid = null;
$(document).ready(function () {

    Janus.init({
        debug: true,
        callback: function () {

            janus = new Janus({
                server: server,
                success: function () {

                    janus.attach({
                        plugin: "janus.plugin.videoroom",
                        opaqueId: opaqueId,
                        success: function (pluginHandle) {
                            sfutest = pluginHandle;
                            Janus.log("Plugin attached! (" + sfutest.getPlugin() + ", id=" + sfutest.getId() + ")");
                            Janus.log("  -- This is a publisher/manager");
                            // listParticipants();
                            registerUsername();
                        },

                        error: function (error) {
                            Janus.error("  -- Error attaching plugin...", error);
                            bootbox.alert("Error attaching plugin... " + error);
                        },

                        consentDialog: function (on) {
                            Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
                        },
                        iceState: function (state) {
                            Janus.log("ICE state changed to " + state);
                        },
                        mediaState: function (medium, on) {
                            Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
                        },
                        webrtcState: function (on) {
                            Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                        },

                        onmessage: function (msg, jsep) {
                            console.log("got a message:", msg);
                            var event = msg["videoroom"];

                            if (event === 'joined') {
                                myid = msg["id"];
                                mypvtid = msg["private_id"];

                                Janus.log("Successfully joined room " + msg["room"] + " with ID " + myid);

                                if (msg["publishers"]) {
                                    var list = msg["publishers"];
                                    var publisher = list[0];
                                    var id = publisher["id"];
                                    var display = publisher["display"];
                                    var audio = publisher["audio_codec"];
                                    var video = publisher["video_codec"];
                                    newRemoteFeed(id, display, audio, video);
                                }
                            }

                            if (event === "event") {
                                // Any new feed to attach to?
                                if (msg["publishers"]) {
                                    var list = msg["publishers"];
                                    Janus.debug("Got a list of available publishers/feeds:", list);
                                    for (var f in list) {
                                        var id = list[f]["id"];
                                        var display = list[f]["display"];
                                        var audio = list[f]["audio_codec"];
                                        var video = list[f]["video_codec"];
                                        Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                        newRemoteFeed(id, display, audio, video);
                                    }
                                } else if (msg["leaving"]) {
                                    // One of the publishers has gone away?
                                    var leaving = msg["leaving"];
                                    Janus.log("Publisher left: " + leaving);
                                    var remoteFeed = null;
                                    for (var i = 1; i < 6; i++) {
                                        if (feeds[i] && feeds[i].rfid == leaving) {
                                            remoteFeed = feeds[i];
                                            break;
                                        }
                                    }
                                    if (remoteFeed != null) {
                                        Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                        $('#remote' + remoteFeed.rfindex).empty().hide();
                                        $('#videoremote' + remoteFeed.rfindex).empty();
                                        feeds[remoteFeed.rfindex] = null;
                                        remoteFeed.detach();
                                    }
                                } else if (msg["unpublished"]) {
                                    // One of the publishers has unpublished?
                                    var unpublished = msg["unpublished"];
                                    Janus.log("Publisher left: " + unpublished);
                                    if (unpublished === 'ok') {
                                        // That's us
                                        sfutest.hangup();
                                        return;
                                    }
                                    var remoteFeed = null;
                                    for (var i = 1; i < 6; i++) {
                                        if (feeds[i] && feeds[i].rfid == unpublished) {
                                            remoteFeed = feeds[i];
                                            break;
                                        }
                                    }
                                    if (remoteFeed != null) {
                                        Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                        $('#remote' + remoteFeed.rfindex).empty().hide();
                                        $('#videoremote' + remoteFeed.rfindex).empty();
                                        feeds[remoteFeed.rfindex] = null;
                                        remoteFeed.detach();
                                    }
                                } else if (msg["error"]) {
                                    if (msg["error_code"] === 426) {
                                        // This is a "no such room" error: give a more meaningful description
                                        bootbox.alert(
                                            "<p>Apparently room <code>" + myroom + "</code> (the one this demo uses as a test room) " +
                                            "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
                                            "configuration file? If not, make sure you copy the details of room <code>" + myroom + "</code> " +
                                            "from that sample in your current configuration file, then restart Janus and try again."
                                        );
                                    } else {
                                        bootbox.alert(msg["error"]);
                                    }
                                }
                            }


                        },

                        onlocalstream: function (stream) {
                            Janus.debug(" ::: Got a local stream :::", stream);
                        },
                        onremotestream: function (stream) {
                        },
                        oncleanup: function () {
                            Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
                        }

                    });
                },
                error: function (error) {
                    Janus.error(error);
                },
                destroyed: function () {
                    window.location.reload();
                }
            })

        }
    })

});


function registerUsername() {
    var register = {
        request: "join",
        room: myroom,
        ptype: "publisher",
        display: "rec"
    };
    myusername = "rec";
    sfutest.send({message: register});
}

function newRemoteFeed(id, display, audio, video) {
    var remoteFeed = null;
    janus.attach(
        {
            plugin: "janus.plugin.videoroom",
            opaqueId: opaqueId,
            success: function (pluginHandle) {
                remoteFeed = pluginHandle;
                remoteFeed.simulcastStarted = false;
                Janus.log("Plugin attached! (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
                Janus.log("  -- This is a subscriber");
                // We wait for the plugin to send us an offer
                var subscribe = {
                    request: "join",
                    room: myroom,
                    ptype: "subscriber",
                    feed: id,
                    private_id: mypvtid
                };
                // In case you don't want to receive audio, video or data, even if the
                // publisher is sending them, set the 'offer_audio', 'offer_video' or
                // 'offer_data' properties to false (they're true by default), e.g.:
                // 		subscribe["offer_video"] = false;
                // For example, if the publisher is VP8 and this is Safari, let's avoid video
                if (Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                    (video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
                    if (video)
                        video = video.toUpperCase()
                    toastr.warning("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
                    subscribe["offer_video"] = false;
                }
                remoteFeed.videoCodec = video;
                remoteFeed.send({message: subscribe});
            },
            error: function (error) {
                Janus.error("  -- Error attaching plugin...", error);
                bootbox.alert("Error attaching plugin... " + error);
            },
            onmessage: function (msg, jsep) {
                Janus.debug(" ::: Got a message (subscriber) :::", msg);
                var event = msg["videoroom"];
                Janus.debug("Event: " + event);
                if (msg["error"]) {
                    bootbox.alert(msg["error"]);
                } else if (event) {
                    if (event === "attached") {
                        // Subscriber created and attached
                        for (var i = 1; i < 6; i++) {
                            if (!feeds[i]) {
                                feeds[i] = remoteFeed;
                                remoteFeed.rfindex = i;
                                break;
                            }
                        }
                        remoteFeed.rfid = msg["id"];
                        remoteFeed.rfdisplay = msg["display"];
                        if (!remoteFeed.spinner) {
                            var target = document.getElementById('videoremote' + remoteFeed.rfindex);
                            remoteFeed.spinner = new Spinner({top: 100}).spin(target);
                        } else {
                            remoteFeed.spinner.spin();
                        }
                        Janus.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
                        $('#remote' + remoteFeed.rfindex).removeClass('hide').html(remoteFeed.rfdisplay).show();
                    } else if (event === "event") {
                        // Check if we got a simulcast-related event from this publisher
                        var substream = msg["substream"];
                        var temporal = msg["temporal"];
                        if ((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                            if (!remoteFeed.simulcastStarted) {
                                remoteFeed.simulcastStarted = true;
                                // Add some new buttons
                                addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === "vp8" || remoteFeed.videoCodec === "h264");
                            }
                            // We just received notice that there's been a switch, update the buttons
                            updateSimulcastButtons(remoteFeed.rfindex, substream, temporal);
                        }
                    } else {
                        // What has just happened?
                    }
                }
                if (jsep) {
                    Janus.debug("Handling SDP as well...", jsep);
                    // Answer and attach
                    remoteFeed.createAnswer(
                        {
                            jsep: jsep,
                            // Add data:true here if you want to subscribe to datachannels as well
                            // (obviously only works if the publisher offered them in the first place)
                            media: {audioSend: false, videoSend: false},	// We want recvonly audio/video
                            success: function (jsep) {
                                Janus.debug("Got SDP!", jsep);
                                var body = {request: "start", room: myroom};
                                remoteFeed.send({message: body, jsep: jsep});
                            },
                            error: function (error) {
                                Janus.error("WebRTC error:", error);
                                bootbox.alert("WebRTC error... " + error.message);
                            }
                        });
                }
            },
            iceState: function (state) {
                Janus.log("ICE state of this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") changed to " + state);
            },
            webrtcState: function (on) {
                Janus.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
            },
            onlocalstream: function (stream) {
                // The subscriber stream is recvonly, we don't expect anything here
            },
            onremotestream: function (stream) {
                Janus.debug("Remote feed #" + remoteFeed.rfindex + ", stream:", stream);
                var addButtons = false;
                if ($('#remotevideo' + remoteFeed.rfindex).length === 0) {
                    addButtons = true;
                    // No remote video yet
                    $('#videoremote' + remoteFeed.rfindex).append('<video class="rounded centered" id="waitingvideo' + remoteFeed.rfindex + '" width="100%" height="100%" />');
                    $('#videoremote' + remoteFeed.rfindex).append('<video class="rounded centered relative hide" id="remotevideo' + remoteFeed.rfindex + '" width="100%" height="100%" autoplay playsinline/>');
                    $('#videoremote' + remoteFeed.rfindex).append(
                        '<span class="label label-primary hide" id="curres' + remoteFeed.rfindex + '" style="position: absolute; bottom: 0px; left: 0px; margin: 15px;"></span>' +
                        '<span class="label label-info hide" id="curbitrate' + remoteFeed.rfindex + '" style="position: absolute; bottom: 0px; right: 0px; margin: 15px;"></span>');
                    // Show the video, hide the spinner and show the resolution when we get a playing event
                    $("#remotevideo" + remoteFeed.rfindex).bind("playing", function () {
                        if (remoteFeed.spinner)
                            remoteFeed.spinner.stop();
                        remoteFeed.spinner = null;
                        $('#waitingvideo' + remoteFeed.rfindex).remove();
                        if (this.videoWidth)
                            $('#remotevideo' + remoteFeed.rfindex).removeClass('hide').show();
                        var width = this.videoWidth;
                        var height = this.videoHeight;
                        $('#curres' + remoteFeed.rfindex).removeClass('hide').text(width + 'x' + height).show();
                        if (Janus.webRTCAdapter.browserDetails.browser === "firefox") {
                            // Firefox Stable has a bug: width and height are not immediately available after a playing
                            setTimeout(function () {
                                var width = $("#remotevideo" + remoteFeed.rfindex).get(0).videoWidth;
                                var height = $("#remotevideo" + remoteFeed.rfindex).get(0).videoHeight;
                                $('#curres' + remoteFeed.rfindex).removeClass('hide').text(width + 'x' + height).show();
                            }, 2000);
                        }
                    });
                }
                Janus.attachMediaStream($('#remotevideo' + remoteFeed.rfindex).get(0), stream);
                var videoTracks = stream.getVideoTracks();
                if (!videoTracks || videoTracks.length === 0) {
                    // No remote video
                    $('#remotevideo' + remoteFeed.rfindex).hide();
                    if ($('#videoremote' + remoteFeed.rfindex + ' .no-video-container').length === 0) {
                        $('#videoremote' + remoteFeed.rfindex).append(
                            '<div class="no-video-container">' +
                            '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                            '<span class="no-video-text">No remote video available</span>' +
                            '</div>');
                    }
                } else {
                    $('#videoremote' + remoteFeed.rfindex + ' .no-video-container').remove();
                    $('#remotevideo' + remoteFeed.rfindex).removeClass('hide').show();
                }
                if (!addButtons)
                    return;
                if (Janus.webRTCAdapter.browserDetails.browser === "chrome" || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
                    Janus.webRTCAdapter.browserDetails.browser === "safari") {
                    $('#curbitrate' + remoteFeed.rfindex).removeClass('hide').show();
                    bitrateTimer[remoteFeed.rfindex] = setInterval(function () {
                        // Display updated bitrate, if supported
                        var bitrate = remoteFeed.getBitrate();
                        $('#curbitrate' + remoteFeed.rfindex).text(bitrate);
                        // Check if the resolution changed too
                        var width = $("#remotevideo" + remoteFeed.rfindex).get(0).videoWidth;
                        var height = $("#remotevideo" + remoteFeed.rfindex).get(0).videoHeight;
                        if (width > 0 && height > 0)
                            $('#curres' + remoteFeed.rfindex).removeClass('hide').text(width + 'x' + height).show();
                    }, 1000);
                }
            },
            oncleanup: function () {
                Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");
                if (remoteFeed.spinner)
                    remoteFeed.spinner.stop();
                remoteFeed.spinner = null;
                $('#remotevideo' + remoteFeed.rfindex).remove();
                $('#waitingvideo' + remoteFeed.rfindex).remove();
                $('#novideo' + remoteFeed.rfindex).remove();
                $('#curbitrate' + remoteFeed.rfindex).remove();
                $('#curres' + remoteFeed.rfindex).remove();
                if (bitrateTimer[remoteFeed.rfindex])
                    clearInterval(bitrateTimer[remoteFeed.rfindex]);
                bitrateTimer[remoteFeed.rfindex] = null;
                remoteFeed.simulcastStarted = false;
                $('#simulcast' + remoteFeed.rfindex).remove();
            }
        });
}
