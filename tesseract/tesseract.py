import pytesseract
import cv2
import pandas as pd
import numpy as np

def getText(image, offset=None):
    image_gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    data = pytesseract.image_to_data(image_gray, lang='tha', output_type='dict')
    result = pd.DataFrame(data)
    oh, ow = image.shape[:2]

    result = result.drop('conf', axis=1).join(result['conf'].apply(int)) \
        .query('conf>50') \
        .query(f'height != {oh} & width != {ow}') \
        .query(f'top != 0 & top + height != {oh} & left != 0 & left + width != {ow}')

    output = []

    for block in result['block_num'].unique():
        tb = result[result['block_num'] == block]
        for line in tb['line_num'].unique():
            tb2 = tb[tb['line_num'] == line]
            top, left = tb2['top'].min(), tb2['left'].min()
            right, bot = (tb2['left'] + tb2['width']).max(), (tb2['top']+tb2['height']).max()

            text = ''.join(list(tb2['text']))
            off = offset
            if offset == None:
                off = int((bot-top) * (1/2))

            if text.strip():
                cap_top = top-off if top-off > 0 else 0
                cap_bot = bot+off if bot+off < oh else oh
                cap_left = left-off if left-off > 0 else 0
                cap_right = right+off if right+off < ow else ow
                
                crop = image_gray[cap_top:cap_bot, cap_left:cap_right]
                better_text = pytesseract.image_to_string(crop, lang='tha', config='--psm 7')
                
                output.append(better_text)
    
    return ' '.join(output)

def loadImg(fileName, rt=None):
    img = cv2.imread(fileName)
    if(rt == 'ccw'):
        img = np.rot90(img,1)
    elif (rt == 'cw'):
        img = np.rot90(img,3)
    return cv2.cvtColor(img , cv2.COLOR_BGR2RGB)

if __name__ == '__main__':
    testImg = loadImg('testImg.jpg')
    print(getText(testImg))