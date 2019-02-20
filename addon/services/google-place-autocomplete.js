import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import { isBlank } from '@ember/utils';

export default Service.extend({
  init() {
    this._super(...arguments);
    const google = this.get('google') || ((window) ? window.google : null);
    if (google && document) {
      let googlePlaces = google.maps.places;
      let autocompleteService = new googlePlaces.AutocompleteService();
      let placesService = new googlePlaces.PlacesService(document.createElement('div'));
      let sessionToken = new googlePlaces.AutocompleteSessionToken();

      this.setProperties({
        autocompleteService: autocompleteService,
        google: google,
        sessionToken: sessionToken,
        placesService: placesService
      });
    }
  },

  getPlacePredictions(properties) {
    if (!properties.hasOwnProperty('input')) {
      return EmberPromise.reject(
        new Error('[service/google-place-autocomplete] input property was not passed inside properties object param')
      );
    }

    if (isBlank(properties.input)) {
      return EmberPromise.resolve([]);
    }

    properties.sessionToken = this.get('sessionToken');

    return new EmberPromise((resolve) => {
      this.get('autocompleteService').getPlacePredictions(
        properties,
        this._googleResponseCallback.bind(this, [resolve], [])
      );
    });
  },

  getQueryPredictions(properties) {
    if (!properties.hasOwnProperty('input')) {
      return EmberPromise.reject(
        new Error('[service/google-place-autocomplete] input property was not passed inside properties object param')
      );
    }

    if (isBlank(properties.input)) {
      return EmberPromise.resolve([]);
    }

    return new EmberPromise((resolve) => {
      this.get('autocompleteService').getQueryPredictions(
        properties,
        this._googleResponseCallback.bind(this, [resolve], [])
      );
    });
  },

  getDetails(request) {
    request.sessionToken = this.get('sessionToken');
    if (!request.hasOwnProperty('fields') && !request.hasOwnProperty('placeId')) {
      return EmberPromise.reject(
        new Error(
          '[service/google-place-autocomplete] getDetails needs the placeId and fields as properties of the request params'
        )
      );
    }

    this.updateSessionToken();

    return new EmberPromise((resolve) => {
      this.get('placesService').getDetails(
        request,
        this._googleResponseCallback.bind(this, [resolve], {})
      );
    });
  },

  _googleResponseCallback(promiseCallbacks, failResponseReturnValue, requestResult, status) {
    const google = this.get('google') || ((window) ? window.google : null);
    const [resolve] = promiseCallbacks;
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      return resolve(requestResult);
    }
    resolve(failResponseReturnValue);
  },

  updateSessionToken() {
    let googlePlaces = this.get('google').maps.places;
    this.set('sessionToken', new googlePlaces.AutocompleteSessionToken());
  }
});
