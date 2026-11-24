// Jedino mesto gde biramo GDE se blogovi čuvaju.
// Kada pređemo na pravu bazu, menjamo samo ovaj red.

import { createLocalStorageRepository } from "./localStorageRepository";

export const blogRepository = createLocalStorageRepository();
