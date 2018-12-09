from colorama import Fore, Style
import jellyfish as jf

tokens_of_interests = {
    # 'take': ['รับประทาน'],
    'eachday': ['วันละ'],
    'eachtime': ['ครั้งละ'],
    'time': ['เช้า', 'กลางวัน', 'เย็น'],
    'event': ['หลังอาหาร', 'ก่อนอาหาร', 'ก่อนนอน']
    # 'times': ['ครั้ง']
}

def capture_token(token, text):
    markers = []
    distances = []

    for i in range(len(text)-len(token)):
        sliced = text[i:i+len(token)]

        distance = len(token) - jf.levenshtein_distance(token, sliced)
        distances.append(distance)

    for i in range(len(distances)-len(token)):
        max_val = max(distances[i:i+len(token)])

        found = False
        for j in range(len(token)):
            if distances[i+j] != max_val:
                distances[i+j] = 0
            else:
                if found:
                    distances[i+j] = 0
                else:
                    found = True

    for i in range(len(distances)):
        if distances[i] > len(token) - 2:
            markers.append(i)

    return markers

def decorate_text_using_markers(text, markers):
    l = []

    for start_tag, end_tag, marker in markers:
        token, positions = marker
    
        for position in positions:
            l.append((position, position+len(token), start_tag, end_tag))

    l.sort()

    d = []
    current_pos = 0
    for start_position, end_position, start_tag, end_tag in l:
        d.append(text[current_pos:start_position])
        d.append(Fore.GREEN+start_tag)
        d.append(text[start_position:end_position])
        d.append(end_tag+Style.RESET_ALL)
        current_pos = end_position
    d.append(text[current_pos:])
    
    return ''.join(d)

def parse_text(text: str):
    text = text.strip()
    if not text:
        return
    print(f'\n{Fore.YELLOW}BEGIN  parsing text{Style.RESET_ALL}')
    print('original: \n', f'{Fore.RED}<ORIGINAL>\n{Style.RESET_ALL}{text}{Fore.RED}\n<ORIGINAL>{Style.RESET_ALL}')
    markers = []
    for category in tokens_of_interests:
        for token in tokens_of_interests[category]:
            markers.append((f'<{category}>', f'</{category}>', (token, capture_token(token, text))))
    print(markers)
    parsed = decorate_text_using_markers(text, markers)
    print('parsed: \n', f'{Fore.RED}<PARSED>\n{Style.RESET_ALL}{parsed}{Fore.RED}\n<PARSED>{Style.RESET_ALL}')
    print(f'{Fore.YELLOW}END parsing text{Style.RESET_ALL}\n')

if __name__ == '__main__':
    with open('text.txt') as f:
        lines = f.readlines()
    
    for line in lines:
        parse_text(line)
    # parse_text(lines[1])