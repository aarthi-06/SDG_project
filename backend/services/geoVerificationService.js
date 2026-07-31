const exifr = require("exifr");

const MATCHED_DISTANCE_KM = 5;
const NEARBY_DISTANCE_KM = 15;

/*
 * Calculate the distance between two GPS coordinates
 * using the Haversine formula.
 */
function calculateDistanceKm(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadiusKm = 6371;

  const toRadians = (value) =>
    (value * Math.PI) / 180;

  const latitudeDifference =
    toRadians(latitude2 - latitude1);

  const longitudeDifference =
    toRadians(longitude2 - longitude1);

  const firstLatitude =
    toRadians(latitude1);

  const secondLatitude =
    toRadians(latitude2);

  const haversineValue =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(haversineValue),
      Math.sqrt(1 - haversineValue)
    );

  return earthRadiusKm * angularDistance;
}

/*
 * Extract GPS information from one uploaded image
 * and compare it with the Panchayat coordinates.
 */
async function verifyImageGeoLocation({
  filePath,
  panchayatGeoReference
}) {
  const defaultResult = {
    metadataAvailable: false,

    imageLatitude: null,
    imageLongitude: null,
    capturedAt: null,

    panchayatLatitude:
      panchayatGeoReference?.latitude ??
      null,

    panchayatLongitude:
      panchayatGeoReference?.longitude ??
      null,

    distanceFromPanchayatKm: null,

    status: "NOT_AVAILABLE",

    reason:
      "The image does not contain usable GPS metadata",

    error: null
  };

  try {
    if (
      !panchayatGeoReference ||
      typeof panchayatGeoReference.latitude !==
        "number" ||
      typeof panchayatGeoReference.longitude !==
        "number"
    ) {
      return {
        ...defaultResult,

        status:
          "PANCHAYAT_LOCATION_NOT_CONFIGURED",

        reason:
          "Reference coordinates are not configured for this Panchayat"
      };
    }

    const metadata = await exifr.parse(
      filePath,
      {
        gps: true,
        exif: true,

        /*
         * Avoid reading metadata sections
         * that are unnecessary for this check.
         */
        tiff: true,
        xmp: false,
        iptc: false,
        interop: false,
        thumbnail: false
      }
    );

    const imageLatitude =
      Number(metadata?.latitude);

    const imageLongitude =
      Number(metadata?.longitude);

    if (
      !Number.isFinite(imageLatitude) ||
      !Number.isFinite(imageLongitude)
    ) {
      return defaultResult;
    }

    const distanceKm =
      calculateDistanceKm(
        imageLatitude,
        imageLongitude,
        panchayatGeoReference.latitude,
        panchayatGeoReference.longitude
      );

    const roundedDistance =
      Number(distanceKm.toFixed(2));

    let status;
    let reason;

    if (
      distanceKm <=
      MATCHED_DISTANCE_KM
    ) {
      status = "MATCHED";

      reason =
        "The image GPS location is within the expected Panchayat area";
    } else if (
      distanceKm <=
      NEARBY_DISTANCE_KM
    ) {
      status = "NEARBY";

      reason =
        "The image was captured near the Panchayat, but not within the preferred distance";
    } else {
      status = "MISMATCHED";

      reason =
        "The image GPS location is far from the selected Panchayat";
    }

    return {
      metadataAvailable: true,

      imageLatitude,
      imageLongitude,

      capturedAt:
        metadata?.DateTimeOriginal ||
        metadata?.CreateDate ||
        null,

      panchayatLatitude:
        panchayatGeoReference.latitude,

      panchayatLongitude:
        panchayatGeoReference.longitude,

      distanceFromPanchayatKm:
        roundedDistance,

      status,
      reason,
      error: null
    };
  } catch (error) {
    console.error(
      "Geo-tag verification failed:",
      error
    );

    return {
      ...defaultResult,

      status: "ERROR",

      reason:
        "Geo-tag verification could not be completed",

      error:
        error.message ||
        "Unable to read image metadata"
    };
  }
}

module.exports = {
  verifyImageGeoLocation,
  calculateDistanceKm
};