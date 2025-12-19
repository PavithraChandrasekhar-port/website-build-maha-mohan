/**
 * Work Data Service
 * 
 * Loads work data directly from the Works folders in src/assets/media/Works
 * Maps work IDs to their actual folder names and media files
 */

import type { MediaItem } from '@/types/cms';

// Import all Alchemy images
import alchemyDivineComedy1 from '@/assets/media/Works/Alchemy/Divine Comedy/Divine Comedy.jpg';
import alchemyDivineComedy2 from '@/assets/media/Works/Alchemy/Divine Comedy/TDC 01.jpg';
import alchemyDivineComedy3 from '@/assets/media/Works/Alchemy/Divine Comedy/TDC 02.jpg';
import alchemyDivineComedy4 from '@/assets/media/Works/Alchemy/Divine Comedy/TDC 03.jpg';
import alchemyDivineComedy5 from '@/assets/media/Works/Alchemy/Divine Comedy/TDC 04.jpg';
import alchemyDivineComedy6 from '@/assets/media/Works/Alchemy/Divine Comedy/TDV 05.jpg';
import alchemyDivineComedy7 from '@/assets/media/Works/Alchemy/Divine Comedy/TVD 06.jpg';
import alchemyDivineComedy8 from '@/assets/media/Works/Alchemy/Divine Comedy/TDV 07.jpg';
import alchemyDivineComedy9 from '@/assets/media/Works/Alchemy/Divine Comedy/08.JPG';
import alchemyDivineComedy10 from '@/assets/media/Works/Alchemy/Divine Comedy/09.jpg';
import alchemyOnceHuman1 from '@/assets/media/Works/Alchemy/Once Human/Once Human.jpg';
import alchemyOnceHuman2 from '@/assets/media/Works/Alchemy/Once Human/H3.jpg';
import alchemyOnceHuman3 from '@/assets/media/Works/Alchemy/Once Human/H5.jpg';
import alchemyOnceHuman4 from '@/assets/media/Works/Alchemy/Once Human/H6.jpg';
import alchemyOnceHuman5 from '@/assets/media/Works/Alchemy/Once Human/H7.jpg';
import alchemyTetheredSecrets1 from '@/assets/media/Works/Alchemy/Tethered Secrets/Tethered Secrets.jpg';
import alchemyTetheredSecrets2 from '@/assets/media/Works/Alchemy/Tethered Secrets/TS 1.jpg';
import alchemyTetheredSecrets3 from '@/assets/media/Works/Alchemy/Tethered Secrets/TS 2.jpg';
import alchemyTetheredSecrets4 from '@/assets/media/Works/Alchemy/Tethered Secrets/TS 3.jpg';
import alchemyTetheredSecrets5 from '@/assets/media/Works/Alchemy/Tethered Secrets/TS 4.jpg';
import alchemyVeiledRuins1 from '@/assets/media/Works/Alchemy/Veiled Ruins/Veiled Ruin.jpg';
import alchemyVeiledRuins2 from '@/assets/media/Works/Alchemy/Veiled Ruins/VR 1.jpg';
import alchemyVeiledRuins3 from '@/assets/media/Works/Alchemy/Veiled Ruins/VR 2.jpg';
import alchemyVeiledRuins4 from '@/assets/media/Works/Alchemy/Veiled Ruins/VR 3.jpg';
import alchemyVeiledRuins5 from '@/assets/media/Works/Alchemy/Veiled Ruins/VR 4.jpg';
import alchemyVeiledRuins6 from '@/assets/media/Works/Alchemy/Veiled Ruins/VR 5.jpg';
import alchemyVeiledRuins7 from '@/assets/media/Works/Alchemy/Veiled Ruins/VR 7.jpg';
import alchemyVeiledRuins8 from '@/assets/media/Works/Alchemy/Veiled Ruins/VR 8.jpg';
import alchemyWhoTaught1 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 1.jpg';
import alchemyWhoTaught2 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 2.jpg';
import alchemyWhoTaught3 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 3.jpg';
import alchemyWhoTaught4 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 4.jpg';
import alchemyWhoTaught5 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 5.jpg';
import alchemyWhoTaught6 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 6.jpg';
import alchemyWhoTaught7 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 7.jpg';
import alchemyWhoTaught8 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 8.jpg';
import alchemyWhoTaught9 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 9.jpg';
import alchemyWhoTaught10 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 10.jpg';
import alchemyWhoTaught11 from '@/assets/media/Works/Alchemy/Who taught you to hold it this way/ROP 11.jpg';

// Import Do I Exist media
import doIExistVideo from '@/assets/media/Works/Do I exist/01..mp4';
import doIExist1 from '@/assets/media/Works/Do I exist/Do I exist.jpg';
import doIExist2 from '@/assets/media/Works/Do I exist/2.Process.jpg';

// Import Echoes of Longing images
import echoes1 from '@/assets/media/Works/Echoes of Longing/EOL.jpg';
import echoes2 from '@/assets/media/Works/Echoes of Longing/01 Maha Mohan.jpg';
import echoes3 from '@/assets/media/Works/Echoes of Longing/02 Edited.jpg';
import echoes4 from '@/assets/media/Works/Echoes of Longing/03 Edited 3.jpg';
import echoes5 from '@/assets/media/Works/Echoes of Longing/04 Mohan_Maha_02.jpg';
import echoes6 from '@/assets/media/Works/Echoes of Longing/05.jpg';
import echoes7 from '@/assets/media/Works/Echoes of Longing/06.jpg';
import echoes8 from '@/assets/media/Works/Echoes of Longing/07.jpg';
import echoes9 from '@/assets/media/Works/Echoes of Longing/08.jpg';
import echoes10 from '@/assets/media/Works/Echoes of Longing/09.jpg';
import echoes11 from '@/assets/media/Works/Echoes of Longing/10.jpg';
import echoes12 from '@/assets/media/Works/Echoes of Longing/11.jpg';
import echoes13 from '@/assets/media/Works/Echoes of Longing/12.jpg';
import echoes14 from '@/assets/media/Works/Echoes of Longing/13.jpg';
import echoes15 from '@/assets/media/Works/Echoes of Longing/14.jpg';
import echoes16 from '@/assets/media/Works/Echoes of Longing/15.jpg';
import echoes17 from '@/assets/media/Works/Echoes of Longing/16.jpg';
import echoes18 from '@/assets/media/Works/Echoes of Longing/17.jpg';
import echoes19 from '@/assets/media/Works/Echoes of Longing/IMG_7066.jpg';
import echoes20 from '@/assets/media/Works/Echoes of Longing/IMG_7076_1.jpg';
import echoes21 from '@/assets/media/Works/Echoes of Longing/IMG_7076.jpg';
import echoes22 from '@/assets/media/Works/Echoes of Longing/IMG_7083.jpg';
import echoes23 from '@/assets/media/Works/Echoes of Longing/IMG_7085.jpg';
import echoes24 from '@/assets/media/Works/Echoes of Longing/IMG_7086.jpg';
import echoes25 from '@/assets/media/Works/Echoes of Longing/IMG_7103.jpg';
import echoes26 from '@/assets/media/Works/Echoes of Longing/IMG_7106.jpg';
import echoes27 from '@/assets/media/Works/Echoes of Longing/IMG_7116.jpg';
import echoes28 from '@/assets/media/Works/Echoes of Longing/IMG_7123.jpg';
import echoes29 from '@/assets/media/Works/Echoes of Longing/IMG_7145.jpg';
import echoes30 from '@/assets/media/Works/Echoes of Longing/IMG_7146.jpg';
import echoes31 from '@/assets/media/Works/Echoes of Longing/IMG_7147.jpg';
import echoes32 from '@/assets/media/Works/Echoes of Longing/IMG_7149.jpg';
import echoes33 from '@/assets/media/Works/Echoes of Longing/IMG_7155.jpg';
import echoes34 from '@/assets/media/Works/Echoes of Longing/IMG_7158.jpg';
import echoes35 from '@/assets/media/Works/Echoes of Longing/IMG_7159.jpg';
import echoes36 from '@/assets/media/Works/Echoes of Longing/IMG_7164.jpg';
import echoes37 from '@/assets/media/Works/Echoes of Longing/IMG_7165.jpg';
import echoes38 from '@/assets/media/Works/Echoes of Longing/IMG_7167.jpg';
import echoes39 from '@/assets/media/Works/Echoes of Longing/IMG_7169.jpg';
import echoes40 from '@/assets/media/Works/Echoes of Longing/IMG_7173.jpg';
import echoes41 from '@/assets/media/Works/Echoes of Longing/IMG_7176.jpg';
import echoes42 from '@/assets/media/Works/Echoes of Longing/IMG_7177.jpg';
import echoes43 from '@/assets/media/Works/Echoes of Longing/IMG_7185.jpg';
import echoes44 from '@/assets/media/Works/Echoes of Longing/IMG_7189.jpg';
import echoes45 from '@/assets/media/Works/Echoes of Longing/IMG_7190.jpg';
import echoes46 from '@/assets/media/Works/Echoes of Longing/IMG_7194_1.jpg';
import echoes47 from '@/assets/media/Works/Echoes of Longing/IMG_7194.jpg';
import echoes48 from '@/assets/media/Works/Echoes of Longing/IMG_7198.jpg';
import echoes49 from '@/assets/media/Works/Echoes of Longing/IMG_7202.jpg';
import echoes50 from '@/assets/media/Works/Echoes of Longing/IMG_7203.jpg';
import echoes51 from '@/assets/media/Works/Echoes of Longing/IMG_7206.jpg';

// Import Ethereal Bodies images
import etherealBodies1 from '@/assets/media/Works/Ethereal Bodies/Ethereal Bodies.jpg';
import etherealBodies2 from '@/assets/media/Works/Ethereal Bodies/EB 01.jpg';
import etherealBodies3 from '@/assets/media/Works/Ethereal Bodies/EB 1 edited 2.jpg';
import etherealBodies4 from '@/assets/media/Works/Ethereal Bodies/EB 1 edited.jpg';
import etherealBodies5 from '@/assets/media/Works/Ethereal Bodies/EB 1.jpg';
import etherealBodies6 from '@/assets/media/Works/Ethereal Bodies/EB 2.JPG';
import etherealBodies7 from '@/assets/media/Works/Ethereal Bodies/EB 3.jpg';
import etherealBodies8 from '@/assets/media/Works/Ethereal Bodies/Ethereal Bodies (2) Edited.jpg';
import etherealBodies9 from '@/assets/media/Works/Ethereal Bodies/Ethereal Bodies (2).jpg';

// Import Iraivi images
import iraivi1 from '@/assets/media/Works/Iraivi/Iraivi.jpg';
import iraivi2 from '@/assets/media/Works/Iraivi/0001.jpg';
import iraivi3 from '@/assets/media/Works/Iraivi/0002.jpg';
import iraivi4 from '@/assets/media/Works/Iraivi/0003.jpg';
import iraivi5 from '@/assets/media/Works/Iraivi/0004.jpg';
import iraivi6 from '@/assets/media/Works/Iraivi/0005.jpg';
import iraivi7 from '@/assets/media/Works/Iraivi/0006.jpg';
import iraivi8 from '@/assets/media/Works/Iraivi/0007.jpg';
import iraivi9 from '@/assets/media/Works/Iraivi/0008.jpg';
import iraivi10 from '@/assets/media/Works/Iraivi/0009.jpg';
import iraivi11 from '@/assets/media/Works/Iraivi/11.jpg';
import iraivi12 from '@/assets/media/Works/Iraivi/Fragments 01.jpg';
import iraivi13 from '@/assets/media/Works/Iraivi/Fragments.jpg';
import iraivi14 from '@/assets/media/Works/Iraivi/Iraivi - Monotone, Nov 2023.jpg';
import iraivi15 from '@/assets/media/Works/Iraivi/Iraivi (2).jpg';
import iraivi16 from '@/assets/media/Works/Iraivi/Iraivi (Goddess in Tamil).jpg';
import iraivi17 from '@/assets/media/Works/Iraivi/Iraivi Installation.jpg';

// Import Melancholy images
import melancholy1 from '@/assets/media/Works/Melancholy/01.jpg';
import melancholy2 from '@/assets/media/Works/Melancholy/02.jpg';
import melancholy3 from '@/assets/media/Works/Melancholy/03.JPG';
import melancholy4 from '@/assets/media/Works/Melancholy/04.jpg';

// Import Naked images
import naked1 from '@/assets/media/Works/Naked/Naked.JPG';
import naked2 from '@/assets/media/Works/Naked/Naked..jpg';
import naked3 from '@/assets/media/Works/Naked/Lacuna.jpg';

// Import Nightmare images
import nightmare1 from '@/assets/media/Works/Nightmare/Nightmare.jpg';
import nightmare2 from '@/assets/media/Works/Nightmare/Nightmare 02.jpg';

// Import Of Webs and Whispers images
import ofWebs1 from '@/assets/media/Works/Of Webs and Whispers/Of Webs and Whisper Interface 01.jpg';
import ofWebs2 from '@/assets/media/Works/Of Webs and Whispers/Of Webs and Whisper Interface.jpg';
import ofWebs3 from '@/assets/media/Works/Of Webs and Whispers/Detail.jpg';
import ofWebs4 from '@/assets/media/Works/Of Webs and Whispers/IMG_8006.jpg';
import ofWebs5 from '@/assets/media/Works/Of Webs and Whispers/IMG_8008.jpg';
import ofWebs6 from '@/assets/media/Works/Of Webs and Whispers/IMG_8009.jpg';
import ofWebs7 from '@/assets/media/Works/Of Webs and Whispers/IMG_8010.jpg';
import ofWebs8 from '@/assets/media/Works/Of Webs and Whispers/IMG_8014.jpg';
import ofWebs9 from '@/assets/media/Works/Of Webs and Whispers/IMG_8015.jpg';
import ofWebs10 from '@/assets/media/Works/Of Webs and Whispers/IMG_8016.jpg';
import ofWebs11 from '@/assets/media/Works/Of Webs and Whispers/IMG_8021.jpg';
import ofWebs12 from '@/assets/media/Works/Of Webs and Whispers/IMG_8022.jpg';
import ofWebs13 from '@/assets/media/Works/Of Webs and Whispers/IMG_8032.jpg';
import ofWebs14 from '@/assets/media/Works/Of Webs and Whispers/IMG_8034.jpg';
import ofWebs15 from '@/assets/media/Works/Of Webs and Whispers/IMG_8048.jpg';
import ofWebs16 from '@/assets/media/Works/Of Webs and Whispers/IMG_8051.jpg';
import ofWebs17 from '@/assets/media/Works/Of Webs and Whispers/Prescription.jpg';
import ofWebs18 from '@/assets/media/Works/Of Webs and Whispers/PS.jpg';
import ofWebsVideo from '@/assets/media/Works/Of Webs and Whispers/Screen_Recording_20250628_225528_Chrome.mp4';
import ofWebsGif from '@/assets/media/Works/Of Webs and Whispers/Untitled-1.gif';

// Import Oru Kudam images
import oruKudam1 from '@/assets/media/Works/Oru Kudam/01.jpg';
import oruKudam2 from '@/assets/media/Works/Oru Kudam/02.jpg';
import oruKudam3 from '@/assets/media/Works/Oru Kudam/03.jpg';
import oruKudam4 from '@/assets/media/Works/Oru Kudam/04.jpg';
import oruKudam5 from '@/assets/media/Works/Oru Kudam/05.jpg';
import oruKudam6 from '@/assets/media/Works/Oru Kudam/06.jpg';
import oruKudam7 from '@/assets/media/Works/Oru Kudam/07.jpg';
import oruKudam8 from '@/assets/media/Works/Oru Kudam/08.jpg';
import oruKudam9 from '@/assets/media/Works/Oru Kudam/IMG_5504.jpg';

// Import The Paradox of Becoming images
import paradox1 from '@/assets/media/Works/The Paradox of Becoming/The Paradox of Becoming.jpeg';
import paradox2 from '@/assets/media/Works/The Paradox of Becoming/01.jpeg';
import paradox3 from '@/assets/media/Works/The Paradox of Becoming/02.jpeg';
import paradox4 from '@/assets/media/Works/The Paradox of Becoming/03.jpeg';
import paradox5 from '@/assets/media/Works/The Paradox of Becoming/04.jpeg';
import paradox6 from '@/assets/media/Works/The Paradox of Becoming/05.jpeg';
import paradox7 from '@/assets/media/Works/The Paradox of Becoming/06.jpeg';
import paradox8 from '@/assets/media/Works/The Paradox of Becoming/07.jpeg';
import paradox9 from '@/assets/media/Works/The Paradox of Becoming/08.jpeg';
import paradox10 from '@/assets/media/Works/The Paradox of Becoming/09.jpeg';
import paradox11 from '@/assets/media/Works/The Paradox of Becoming/10.jpeg';
import paradox12 from '@/assets/media/Works/The Paradox of Becoming/11.jpeg';
import paradox13 from '@/assets/media/Works/The Paradox of Becoming/12.jpeg';
import paradox14 from '@/assets/media/Works/The Paradox of Becoming/13.jpeg';
import paradox15 from '@/assets/media/Works/The Paradox of Becoming/Bronze.jpg';
import paradox16 from '@/assets/media/Works/The Paradox of Becoming/Gelman Gallery, RISD Museum.jpg';
import paradox17 from '@/assets/media/Works/The Paradox of Becoming/54116353587_cf75de0fcd_o.jpg';

// Import Thirai images
import thirai1 from '@/assets/media/Works/Thirai/Thirai.jpg';

// Import Voiceless Despair images
import voiceless1 from '@/assets/media/Works/Voiceless Despair/Voiceless Despair.jpg';
import voiceless2 from '@/assets/media/Works/Voiceless Despair/VD 1.jpg';
import voiceless3 from '@/assets/media/Works/Voiceless Despair/VD 2.jpg';
import voiceless4 from '@/assets/media/Works/Voiceless Despair/VD 3.jpg';
import voiceless5 from '@/assets/media/Works/Voiceless Despair/VD 4.jpg';
import voiceless6 from '@/assets/media/Works/Voiceless Despair/VD 5.JPG';
import voiceless7 from '@/assets/media/Works/Voiceless Despair/VD 6.jpg';
import voiceless8 from '@/assets/media/Works/Voiceless Despair/VD 7.jpg';
import voiceless9 from '@/assets/media/Works/Voiceless Despair/VD 8.JPG';
import voiceless10 from '@/assets/media/Works/Voiceless Despair/VD 9.JPG';
import voiceless11 from '@/assets/media/Works/Voiceless Despair/Voiceless despair 11.JPG';

// Import Whisper images
import whisper1 from '@/assets/media/Works/Whisper/Whisper.jpg';
import whisper2 from '@/assets/media/Works/Whisper/Whisper 2.jpg';

export interface WorkDetail {
  id: string;
  name: string;
  medium: string;
  dimensions: string;
  year: string;
  media: MediaItem[];
}

// Work data mapping
const workData: Record<string, WorkDetail> = {
  'alchemy': {
    id: 'alchemy',
    name: 'Alchemy',
    medium: 'Installation',
    dimensions: "03' x 84'",
    year: '2025',
    media: [
      { id: '1', type: 'image', url: alchemyDivineComedy1, alt: 'Divine Comedy' },
      { id: '2', type: 'image', url: alchemyDivineComedy2, alt: 'TDC 01' },
      { id: '3', type: 'image', url: alchemyDivineComedy3, alt: 'TDC 02' },
      { id: '4', type: 'image', url: alchemyDivineComedy4, alt: 'TDC 03' },
      { id: '5', type: 'image', url: alchemyDivineComedy5, alt: 'TDC 04' },
      { id: '6', type: 'image', url: alchemyDivineComedy6, alt: 'TDV 05' },
      { id: '7', type: 'image', url: alchemyDivineComedy7, alt: 'TVD 06' },
      { id: '8', type: 'image', url: alchemyDivineComedy8, alt: 'TDV 07' },
      { id: '9', type: 'image', url: alchemyDivineComedy9, alt: '08' },
      { id: '10', type: 'image', url: alchemyDivineComedy10, alt: '09' },
      { id: '11', type: 'image', url: alchemyOnceHuman1, alt: 'Once Human' },
      { id: '12', type: 'image', url: alchemyOnceHuman2, alt: 'H3' },
      { id: '13', type: 'image', url: alchemyOnceHuman3, alt: 'H5' },
      { id: '14', type: 'image', url: alchemyOnceHuman4, alt: 'H6' },
      { id: '15', type: 'image', url: alchemyOnceHuman5, alt: 'H7' },
      { id: '16', type: 'image', url: alchemyTetheredSecrets1, alt: 'Tethered Secrets' },
      { id: '17', type: 'image', url: alchemyTetheredSecrets2, alt: 'TS 1' },
      { id: '18', type: 'image', url: alchemyTetheredSecrets3, alt: 'TS 2' },
      { id: '19', type: 'image', url: alchemyTetheredSecrets4, alt: 'TS 3' },
      { id: '20', type: 'image', url: alchemyTetheredSecrets5, alt: 'TS 4' },
      { id: '21', type: 'image', url: alchemyVeiledRuins1, alt: 'Veiled Ruin' },
      { id: '22', type: 'image', url: alchemyVeiledRuins2, alt: 'VR 1' },
      { id: '23', type: 'image', url: alchemyVeiledRuins3, alt: 'VR 2' },
      { id: '24', type: 'image', url: alchemyVeiledRuins4, alt: 'VR 3' },
      { id: '25', type: 'image', url: alchemyVeiledRuins5, alt: 'VR 4' },
      { id: '26', type: 'image', url: alchemyVeiledRuins6, alt: 'VR 5' },
      { id: '27', type: 'image', url: alchemyVeiledRuins7, alt: 'VR 7' },
      { id: '28', type: 'image', url: alchemyVeiledRuins8, alt: 'VR 8' },
      { id: '29', type: 'image', url: alchemyWhoTaught1, alt: 'ROP 1' },
      { id: '30', type: 'image', url: alchemyWhoTaught2, alt: 'ROP 2' },
      { id: '31', type: 'image', url: alchemyWhoTaught3, alt: 'ROP 3' },
      { id: '32', type: 'image', url: alchemyWhoTaught4, alt: 'ROP 4' },
      { id: '33', type: 'image', url: alchemyWhoTaught5, alt: 'ROP 5' },
      { id: '34', type: 'image', url: alchemyWhoTaught6, alt: 'ROP 6' },
      { id: '35', type: 'image', url: alchemyWhoTaught7, alt: 'ROP 7' },
      { id: '36', type: 'image', url: alchemyWhoTaught8, alt: 'ROP 8' },
      { id: '37', type: 'image', url: alchemyWhoTaught9, alt: 'ROP 9' },
      { id: '38', type: 'image', url: alchemyWhoTaught10, alt: 'ROP 10' },
      { id: '39', type: 'image', url: alchemyWhoTaught11, alt: 'ROP 11' },
    ],
  },
  'do-i-exist': {
    id: 'do-i-exist',
    name: 'Do I Exist',
    medium: 'Video Installation',
    dimensions: "Variable",
    year: '2024',
    media: [
      { id: '1', type: 'video', url: doIExistVideo, alt: 'Do I Exist Video' },
      { id: '2', type: 'image', url: doIExist1, alt: 'Do I Exist' },
      { id: '3', type: 'image', url: doIExist2, alt: 'Process' },
    ],
  },
  'echoes-of-longing': {
    id: 'echoes-of-longing',
    name: 'Echoes of Longing',
    medium: 'Installation',
    dimensions: "03' x 84'",
    year: '2024',
    media: [
      { id: '1', type: 'image', url: echoes1, alt: 'Echoes of Longing' },
      { id: '2', type: 'image', url: echoes2, alt: '01 Maha Mohan' },
      { id: '3', type: 'image', url: echoes3, alt: '02 Edited' },
      { id: '4', type: 'image', url: echoes4, alt: '03 Edited 3' },
      { id: '5', type: 'image', url: echoes5, alt: '04 Mohan_Maha_02' },
      { id: '6', type: 'image', url: echoes6, alt: '05' },
      { id: '7', type: 'image', url: echoes7, alt: '06' },
      { id: '8', type: 'image', url: echoes8, alt: '07' },
      { id: '9', type: 'image', url: echoes9, alt: '08' },
      { id: '10', type: 'image', url: echoes10, alt: '09' },
      { id: '11', type: 'image', url: echoes11, alt: '10' },
      { id: '12', type: 'image', url: echoes12, alt: '11' },
      { id: '13', type: 'image', url: echoes13, alt: '12' },
      { id: '14', type: 'image', url: echoes14, alt: '13' },
      { id: '15', type: 'image', url: echoes15, alt: '14' },
      { id: '16', type: 'image', url: echoes16, alt: '15' },
      { id: '17', type: 'image', url: echoes17, alt: '16' },
      { id: '18', type: 'image', url: echoes18, alt: '17' },
      { id: '19', type: 'image', url: echoes19, alt: 'IMG_7066' },
      { id: '20', type: 'image', url: echoes20, alt: 'IMG_7076_1' },
      { id: '21', type: 'image', url: echoes21, alt: 'IMG_7076' },
      { id: '22', type: 'image', url: echoes22, alt: 'IMG_7083' },
      { id: '23', type: 'image', url: echoes23, alt: 'IMG_7085' },
      { id: '24', type: 'image', url: echoes24, alt: 'IMG_7086' },
      { id: '25', type: 'image', url: echoes25, alt: 'IMG_7103' },
      { id: '26', type: 'image', url: echoes26, alt: 'IMG_7106' },
      { id: '27', type: 'image', url: echoes27, alt: 'IMG_7116' },
      { id: '28', type: 'image', url: echoes28, alt: 'IMG_7123' },
      { id: '29', type: 'image', url: echoes29, alt: 'IMG_7145' },
      { id: '30', type: 'image', url: echoes30, alt: 'IMG_7146' },
      { id: '31', type: 'image', url: echoes31, alt: 'IMG_7147' },
      { id: '32', type: 'image', url: echoes32, alt: 'IMG_7149' },
      { id: '33', type: 'image', url: echoes33, alt: 'IMG_7155' },
      { id: '34', type: 'image', url: echoes34, alt: 'IMG_7158' },
      { id: '35', type: 'image', url: echoes35, alt: 'IMG_7159' },
      { id: '36', type: 'image', url: echoes36, alt: 'IMG_7164' },
      { id: '37', type: 'image', url: echoes37, alt: 'IMG_7165' },
      { id: '38', type: 'image', url: echoes38, alt: 'IMG_7167' },
      { id: '39', type: 'image', url: echoes39, alt: 'IMG_7169' },
      { id: '40', type: 'image', url: echoes40, alt: 'IMG_7173' },
      { id: '41', type: 'image', url: echoes41, alt: 'IMG_7176' },
      { id: '42', type: 'image', url: echoes42, alt: 'IMG_7177' },
      { id: '43', type: 'image', url: echoes43, alt: 'IMG_7185' },
      { id: '44', type: 'image', url: echoes44, alt: 'IMG_7189' },
      { id: '45', type: 'image', url: echoes45, alt: 'IMG_7190' },
      { id: '46', type: 'image', url: echoes46, alt: 'IMG_7194_1' },
      { id: '47', type: 'image', url: echoes47, alt: 'IMG_7194' },
      { id: '48', type: 'image', url: echoes48, alt: 'IMG_7198' },
      { id: '49', type: 'image', url: echoes49, alt: 'IMG_7202' },
      { id: '50', type: 'image', url: echoes50, alt: 'IMG_7203' },
      { id: '51', type: 'image', url: echoes51, alt: 'IMG_7206' },
    ],
  },
  'ethereal-bodies': {
    id: 'ethereal-bodies',
    name: 'Ethereal Bodies',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2024',
    media: [
      { id: '1', type: 'image', url: etherealBodies1, alt: 'Ethereal Bodies' },
      { id: '2', type: 'image', url: etherealBodies2, alt: 'EB 01' },
      { id: '3', type: 'image', url: etherealBodies3, alt: 'EB 1 edited 2' },
      { id: '4', type: 'image', url: etherealBodies4, alt: 'EB 1 edited' },
      { id: '5', type: 'image', url: etherealBodies5, alt: 'EB 1' },
      { id: '6', type: 'image', url: etherealBodies6, alt: 'EB 2' },
      { id: '7', type: 'image', url: etherealBodies7, alt: 'EB 3' },
      { id: '8', type: 'image', url: etherealBodies8, alt: 'Ethereal Bodies (2) Edited' },
      { id: '9', type: 'image', url: etherealBodies9, alt: 'Ethereal Bodies (2)' },
    ],
  },
  'iraivi': {
    id: 'iraivi',
    name: 'Iraivi',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: iraivi1, alt: 'Iraivi' },
      { id: '2', type: 'image', url: iraivi2, alt: '0001' },
      { id: '3', type: 'image', url: iraivi3, alt: '0002' },
      { id: '4', type: 'image', url: iraivi4, alt: '0003' },
      { id: '5', type: 'image', url: iraivi5, alt: '0004' },
      { id: '6', type: 'image', url: iraivi6, alt: '0005' },
      { id: '7', type: 'image', url: iraivi7, alt: '0006' },
      { id: '8', type: 'image', url: iraivi8, alt: '0007' },
      { id: '9', type: 'image', url: iraivi9, alt: '0008' },
      { id: '10', type: 'image', url: iraivi10, alt: '0009' },
      { id: '11', type: 'image', url: iraivi11, alt: '11' },
      { id: '12', type: 'image', url: iraivi12, alt: 'Fragments 01' },
      { id: '13', type: 'image', url: iraivi13, alt: 'Fragments' },
      { id: '14', type: 'image', url: iraivi14, alt: 'Iraivi - Monotone, Nov 2023' },
      { id: '15', type: 'image', url: iraivi15, alt: 'Iraivi (2)' },
      { id: '16', type: 'image', url: iraivi16, alt: 'Iraivi (Goddess in Tamil)' },
      { id: '17', type: 'image', url: iraivi17, alt: 'Iraivi Installation' },
    ],
  },
  'melancholy': {
    id: 'melancholy',
    name: 'Melancholy',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: melancholy1, alt: '01' },
      { id: '2', type: 'image', url: melancholy2, alt: '02' },
      { id: '3', type: 'image', url: melancholy3, alt: '03' },
      { id: '4', type: 'image', url: melancholy4, alt: '04' },
    ],
  },
  'naked': {
    id: 'naked',
    name: 'Naked',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: naked1, alt: 'Naked' },
      { id: '2', type: 'image', url: naked2, alt: 'Naked' },
      { id: '3', type: 'image', url: naked3, alt: 'Lacuna' },
    ],
  },
  'nightmare': {
    id: 'nightmare',
    name: 'Nightmare',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: nightmare1, alt: 'Nightmare' },
      { id: '2', type: 'image', url: nightmare2, alt: 'Nightmare 02' },
    ],
  },
  'of-webs-and-whispers': {
    id: 'of-webs-and-whispers',
    name: 'Of Webs and Whispers',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: ofWebs1, alt: 'Of Webs and Whisper Interface 01' },
      { id: '2', type: 'image', url: ofWebs2, alt: 'Of Webs and Whisper Interface' },
      { id: '3', type: 'image', url: ofWebs3, alt: 'Detail' },
      { id: '4', type: 'image', url: ofWebs4, alt: 'IMG_8006' },
      { id: '5', type: 'image', url: ofWebs5, alt: 'IMG_8008' },
      { id: '6', type: 'image', url: ofWebs6, alt: 'IMG_8009' },
      { id: '7', type: 'image', url: ofWebs7, alt: 'IMG_8010' },
      { id: '8', type: 'image', url: ofWebs8, alt: 'IMG_8014' },
      { id: '9', type: 'image', url: ofWebs9, alt: 'IMG_8015' },
      { id: '10', type: 'image', url: ofWebs10, alt: 'IMG_8016' },
      { id: '11', type: 'image', url: ofWebs11, alt: 'IMG_8021' },
      { id: '12', type: 'image', url: ofWebs12, alt: 'IMG_8022' },
      { id: '13', type: 'image', url: ofWebs13, alt: 'IMG_8032' },
      { id: '14', type: 'image', url: ofWebs14, alt: 'IMG_8034' },
      { id: '15', type: 'image', url: ofWebs15, alt: 'IMG_8048' },
      { id: '16', type: 'image', url: ofWebs16, alt: 'IMG_8051' },
      { id: '17', type: 'image', url: ofWebs17, alt: 'Prescription' },
      { id: '18', type: 'image', url: ofWebs18, alt: 'PS' },
      { id: '19', type: 'video', url: ofWebsVideo, alt: 'Screen Recording' },
      { id: '20', type: 'image', url: ofWebsGif, alt: 'Untitled-1' },
    ],
  },
  'oru-kudam': {
    id: 'oru-kudam',
    name: 'Oru Kudam',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: oruKudam1, alt: '01' },
      { id: '2', type: 'image', url: oruKudam2, alt: '02' },
      { id: '3', type: 'image', url: oruKudam3, alt: '03' },
      { id: '4', type: 'image', url: oruKudam4, alt: '04' },
      { id: '5', type: 'image', url: oruKudam5, alt: '05' },
      { id: '6', type: 'image', url: oruKudam6, alt: '06' },
      { id: '7', type: 'image', url: oruKudam7, alt: '07' },
      { id: '8', type: 'image', url: oruKudam8, alt: '08' },
      { id: '9', type: 'image', url: oruKudam9, alt: 'IMG_5504' },
    ],
  },
  'the-paradox-of-becoming': {
    id: 'the-paradox-of-becoming',
    name: 'The Paradox of Becoming',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2024',
    media: [
      { id: '1', type: 'image', url: paradox1, alt: 'The Paradox of Becoming' },
      { id: '2', type: 'image', url: paradox2, alt: '01' },
      { id: '3', type: 'image', url: paradox3, alt: '02' },
      { id: '4', type: 'image', url: paradox4, alt: '03' },
      { id: '5', type: 'image', url: paradox5, alt: '04' },
      { id: '6', type: 'image', url: paradox6, alt: '05' },
      { id: '7', type: 'image', url: paradox7, alt: '06' },
      { id: '8', type: 'image', url: paradox8, alt: '07' },
      { id: '9', type: 'image', url: paradox9, alt: '08' },
      { id: '10', type: 'image', url: paradox10, alt: '09' },
      { id: '11', type: 'image', url: paradox11, alt: '10' },
      { id: '12', type: 'image', url: paradox12, alt: '11' },
      { id: '13', type: 'image', url: paradox13, alt: '12' },
      { id: '14', type: 'image', url: paradox14, alt: '13' },
      { id: '15', type: 'image', url: paradox15, alt: 'Bronze' },
      { id: '16', type: 'image', url: paradox16, alt: 'Gelman Gallery, RISD Museum' },
      { id: '17', type: 'image', url: paradox17, alt: '54116353587_cf75de0fcd_o' },
    ],
  },
  'thirai': {
    id: 'thirai',
    name: 'Thirai',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: thirai1, alt: 'Thirai' },
    ],
  },
  'voiceless-despair': {
    id: 'voiceless-despair',
    name: 'Voiceless Despair',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: voiceless1, alt: 'Voiceless Despair' },
      { id: '2', type: 'image', url: voiceless2, alt: 'VD 1' },
      { id: '3', type: 'image', url: voiceless3, alt: 'VD 2' },
      { id: '4', type: 'image', url: voiceless4, alt: 'VD 3' },
      { id: '5', type: 'image', url: voiceless5, alt: 'VD 4' },
      { id: '6', type: 'image', url: voiceless6, alt: 'VD 5' },
      { id: '7', type: 'image', url: voiceless7, alt: 'VD 6' },
      { id: '8', type: 'image', url: voiceless8, alt: 'VD 7' },
      { id: '9', type: 'image', url: voiceless9, alt: 'VD 8' },
      { id: '10', type: 'image', url: voiceless10, alt: 'VD 9' },
      { id: '11', type: 'image', url: voiceless11, alt: 'Voiceless despair 11' },
    ],
  },
  'whisper': {
    id: 'whisper',
    name: 'Whisper',
    medium: 'Installation',
    dimensions: "Variable",
    year: '2023',
    media: [
      { id: '1', type: 'image', url: whisper1, alt: 'Whisper' },
      { id: '2', type: 'image', url: whisper2, alt: 'Whisper 2' },
    ],
  },
};

/**
 * Get work detail by ID
 */
export function getWorkById(id: string): WorkDetail | null {
  return workData[id] || null;
}

/**
 * Get all works
 */
export function getAllWorks(): WorkDetail[] {
  return Object.values(workData);
}

