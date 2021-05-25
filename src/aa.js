self=this;
function name(dx) {
    var dy = 0,
    oldLat = self.wwd.navigator.lookAtLocation.latitude,
    oldLon = self.wwd.navigator.lookAtLocation.longitude,
    // Scale the increment by a constant and the relative distance of the eye to the surface.
    scale = self.panIncrement
        * (self.wwd.navigator.range / self.wwd.globe.radiusAt(oldLat, oldLon)),
    heading = self.wwd.navigator.heading + (Math.atan2(dx, dy) * Angle.RADIANS_TO_DEGREES),
    distance = scale * Math.sqrt(dx * dx + dy * dy);
    Location.greatCircleLocation(self.wwd.navigator.lookAtLocation, heading, -dx,
        self.wwd.navigator.lookAtLocation);
     console.log(self.wwd.navigator.lookAtLocation+"/"+heading+"/"+distance+"/");           
    self.wwd.redraw();
 }

$("#aaa").on("click", function (event) {
    var dx = 0.52;
    name(dx);
});

