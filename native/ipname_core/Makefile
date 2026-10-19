CC ?= gcc
CFLAGS ?= -O3 -Wall -fPIC -Iinclude

ifeq ($(OS),Windows_NT)
    TARGET = ipname_core.dll
    LDFLAGS = -shared -lws2_32 -liphlpapi
else
    TARGET = libipname_core.so
    LDFLAGS = -shared
endif

all: $(TARGET)

$(TARGET): src/ipname_core.c
	$(CC) $(CFLAGS) -DIPNAME_CORE_EXPORTS -o $@ $< $(LDFLAGS)

clean:
	rm -f $(TARGET) *.o

.PHONY: all clean
