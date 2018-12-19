import jellyfish as jf
import numpy as np

tokens_of_interests = {
    'per_times': ['ครั้งละ'],
    'per_hour': ['ทุกๆ'],
    'per_day': ['วันละ'],
    'per_week': ['สัปดาห์ละ'],
    'time': [['หลังอาหาร','ก่อนอาหาร'], ['เช้า','กลางวัน','เย็น','ก่อนนอน']],
}


def findToken(data, token, max_distance = 2):
  result = []
  
  for j in range(1,max_distance+1):
    tkl = len(token)+j
    if len(data) >= tkl:
      dl = []
      for i in range(len(data)-tkl):
        distance = jf.levenshtein_distance(data[i:i+tkl], token)
        dl.append(distance)
      for i in range(tkl):
        dl.append(tkl)
      result.append(dl)
    else:
      dl = []
      for i in range(len(data)):
        dl.append(len(token))
      result.append(dl)
  
  if len(data) >= len(token):
    dl = []
    for i in range(len(data)-len(token)):
      distance = jf.levenshtein_distance(data[i:i+len(token)], token)
      dl.append(distance)
    for i in range(len(token)):
      dl.append(len(token))
    result.append(dl)
  else:
    dl = []
    for i in range(len(data)):
      dl.append(len(token))
    result.append(dl)
  
  for j in range(1,max_distance+1):
    tkl = len(token)-j
    if len(data) >= tkl:
      dl = []   
      for i in range(len(data)-tkl):
        distance = jf.levenshtein_distance(data[i:i+tkl], token)
        dl.append(distance)
      for i in range(tkl):
        dl.append(tkl)
      result.append(dl)
    else:
      dl = []
      for i in range(len(data)):
        dl.append(len(token))
      result.append(dl)
      
   
  if len(result) == 0:
    return
  for dl in result:   
    if len(dl) == 0:
      return
  eachResult = np.array(result)
  lowest_i = np.unravel_index(np.argmin(eachResult),eachResult.shape)
  if eachResult[lowest_i[0]][lowest_i[1]] <= max_distance:
    next_i = lowest_i[1]+len(token)+max_distance-lowest_i[0]
    return data[lowest_i[1]:next_i], data[next_i:]
    

def getDrugInfo(data):
  output = {}
  
  res = findToken(data, tokens_of_interests['per_times'][0])
  if res == None:
    pass
  else:
    t = res[1].strip()
    output['per_times'] = t[0]
  
  res = findToken(data, tokens_of_interests['per_week'][0])
  if res == None:
    res = findToken(data, tokens_of_interests['per_day'][0])
    if res == None:
      res = findToken(data, tokens_of_interests['per_hour'][0], max_distance=1)
      if res == None:
        pass
      else:
        t = res[1].strip()
        output['per_hour'] = t[0]
    else:
      t = res[1].strip()
      output['per_day'] = t[0]
  else:
    t = res[1].strip()
    output['per_week'] = t[0]
    
  for token in tokens_of_interests['time'][0]:
    res = findToken(data, token)
    if res:
      output['time'] = token
      break
  
  for token in tokens_of_interests['time'][1]:
    max_distance = 1
    if len(token) > 4:
      max_distance = 2
    
    res = findToken(data, token, max_distance=max_distance)
    if res:
      if 'time2' not in output:
        output['time2'] = []
      output['time2'].append(token)
  
  return output

if __name__ == '__main__':
    with open('text.txt') as f:
        lines = f.readlines()
    
    for line in lines:
        getDrugInfo(line)
    # parse_text(lines[1])